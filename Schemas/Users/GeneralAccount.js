const { Schema, model, Types } = require("mongoose");
var getIP = require("ipware")().get_ip;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWTTokenDao = require("../../Dao/JWTTokenDao");
const { AUTH_SECRET } = require("../../Config");

const GeneralAccountSchema = new Schema(
  {
    type: {
      type: String,
      default: "GENERAL",
    },
    firstName: {
      type: String,
      required: [true, "First name must not be empty"],
    },
    lastName: {
      type: String,
      required: [true, "Last name must not be empty."],
    },
    nationalID: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "Contact number must not be empty."],
    },
    tempPhone: {
      type: String,
      unique: true,
      select: false,
      expires: 3600,
    },
    email: {
      type: String,
      required: [true, "Email must not be empty."],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Invalid email type.",
      ],
    },
    address: {
      type: String,
      required: [true, "address must not be empty."],
      minlength: [8, "address must have at least 8 characters."],
      maxlength: [500, "address must not have more than 60 characters."],
    },
    password: {
      type: String,
      required: [true, "Password must not be empty."],
      minlength: [8, "Password must have at least 8 characters."],
      select: false, // password will not be retrived unless specified
    },
    transactionPassword: {
      type: String,
      required: [true, "Password must not be empty."],
      minlength: [8, "Password must have at least 8 characters."],
      select: false, // password will not be retrived unless specified
    },
    imagePaths: {
      type: Array,
      required: true,
    },
    mainAccountID: {
      type: String,
      unique: true,
    },
    previousAccounts: {
      type: Array,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    two_factor_secret: {
      type: String,
      required: false,
      select: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalReason: {
      type: String,
      default:
        "All new registrations must be approved by the management, our team will get in touch with you within 3 working days.",
    },
    approvedBy: {
      type: Types.ObjectId,
      required: false,
      ref: "service_user",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    email_verify_token: { type: String, select: false, expires: 600 },
    tphone_verify_token: { type: String, select: false, expires: 600 },
    phone_verified_at: Date,
    email_verified_at: Date,
    pwd_recovery_token: { type: String, select: false, expires: 600 },
  },

  { timestamps: true }
);

// GeneralAccountSchema.pre("save", function (next) {
//   // encrypt password if updated
//   if (this.isModified("password"))
//     this.password = bcrypt.hashSync(this.password, 12);
//   // encrypt transaction password if updated
//   if (this.isModified("transactionPassword"))
//     this.transactionPassword = bcrypt.hashSync(this.transactionPassword, 12);

//   next();
// });

GeneralAccountSchema.methods.matchPasswords = function (password) {
  return bcrypt.compareSync(password, this.password);
};

GeneralAccountSchema.methods.matchPasswordRecoveryTokens = function (token) {
  return bcrypt.compareSync(token, this.password_recovery_token);
};

GeneralAccountSchema.methods.getSignedJwtToken = async function (
  req,
  is2FAAuthorized
) {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, //1hour
      data: {
        type: this.type,
        nationalID: this.nationalID,
        _id: this._id,
        user_id: this._id,
        phone: this.phone,
        isTwoFactorEnabled: this.isTwoFactorEnabled,
        is2FAAuthorized,
        isApproved: this.isApproved,
        isLocked: this.isLocked,
      },
    },
    AUTH_SECRET
  );

  try {
    await JWTTokenDao.saveTokenWithUseragent(
      token,
      this,
      req.useragent,
      getIP(req).clientIp
    );
  } catch (error) {
    console.log("Error saving JWT");
  }

  return token;
};

const GeneralAccount = model("general_user", GeneralAccountSchema);
module.exports = GeneralAccount;
