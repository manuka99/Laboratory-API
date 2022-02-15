const { Schema, model, Types } = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AUTH_SECRET } = require("../../Config");

const ServiceAccountSchema = new Schema(
  {
    type: {
      type: String,
      default: "SERVICE",
    },
    loginID: {
      type: String,
      unique: true,
      required: [true, "Login ID must not be empty"],
    },
    generalUser: {
      type: Types.ObjectId,
      ref: "general_user",
      unique: true,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "Contact number must not be empty."],
    },
    password: {
      type: String,
      required: [true, "Password must not be empty."],
      minlength: [8, "Password must have at least 8 characters."],
      select: false, // password will not be retrived unless specified
    },
    is_two_factor_enabled: {
      type: Boolean,
      required: false,
    },
    two_factor_secret: {
      type: String,
      required: false,
      select: false
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Types.ObjectId,
      required: false,
      ref: "service_user",
    },
    isLocked: Boolean,
    phone_verified_at: Date,
    password_recovery_token: { type: String, select: false },
    password_recovery_expire: { type: String, select: false },
  },

  { timestamps: true }
);

ServiceAccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  // encrypt password if updated
  this.password = bcrypt.hashSync(this.password, 12);
  next();
});

ServiceAccountSchema.methods.matchPasswords = function (password) {
  return bcrypt.compareSync(password, this.password);
};

ServiceAccountSchema.methods.matchPasswordRecoveryTokens = function (token) {
  return bcrypt.compareSync(token, this.password_recovery_token);
};

ServiceAccountSchema.methods.getSignedJwtToken = function (is2FAAuthorized) {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, //1hour
      data: {
        type: this.type,
        loginID: this.loginID,
        user_id: this.generalUser,
        is_two_factor_enabled: this.is_two_factor_enabled,
        is2FAAuthorized,
        phone: this.phone,
      },
    },
    AUTH_SECRET
  );
};

ServiceAccountSchema.methods.getPasswordRecoveryToken = function () {
  const recovery_token = crypto.randomBytes(32).toString("hex");
  this.password_recovery_token = bcrypt.hashSync(recovery_token, 10);
  this.password_recovery_expire = Date.now() + 10 * (60 * 1000);
  this.save();
  return recovery_token;
};

const ServiceAccount = model("service_user", ServiceAccountSchema);
module.exports = ServiceAccount;
