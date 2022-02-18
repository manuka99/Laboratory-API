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
    middleName: {
      type: String,
      required: [true, "Middle name must not be empty."],
    },
    lastName: {
      type: String,
      required: [true, "Last name must not be empty."],
    },
    gender: {
      type: String,
      required: [true, "Gender must not be empty"],
      enum: ["female", "male"],
    },
    nationalID: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "Contact number must not be empty."],
    },
    tempPhone: {
      type: String,
      unique: true,
      expires: 60 * 15,
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
    street: {
      type: String,
      required: [true, "street must not be empty."],
    },
    province: {
      type: String,
      required: [true, "province must not be empty."],
    },
    district: {
      type: String,
      required: [true, "district must not be empty."],
    },
    country: {
      type: String,
      required: [true, "country must not be empty."],
    },
    nationality: {
      type: Array,
      required: true,
    },
    address: {
      type: String,
      required: [true, "address must not be empty."],
      minlength: [8, "address must have at least 8 characters."],
      maxlength: [500, "address must not have more than 60 characters."],
    },
    zipCode: {
      type: String,
      required: [true, "Zip Code must not be empty."],
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
    isMobileAuthenticationEnabled: {
      type: Boolean,
      default: false,
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

    phone_verified_at: Date,
    email_verified_at: Date,

    pwd_recovery_token: { type: String, select: false },
    pwd_rtoken_exp_at: { type: Date, select: false },

    phone_verify_token: { type: String, select: false },
    phone_vtoken_exp_at: { type: Date, select: false },

    tphone_verify_token: { type: String, select: false },
    tphone_vtoken_exp_at: { type: Date, select: false },

    email_verify_token: { type: String, select: false },
    email_vtoken_exp_at: { type: Date, select: false },
  },

  { timestamps: true }
);

GeneralAccountSchema.methods.matchPasswords = function (password) {
  return bcrypt.compareSync(password, this.password);
};

GeneralAccountSchema.methods.matchPasswordRecoveryTokens = function (token) {
  return bcrypt.compareSync(token, this.password_recovery_token);
};

GeneralAccountSchema.methods.getSignedJwtToken = async function (
  req,
  oldToken,
  data
) {
  try {
    var newTokenData = {
      type: this.type,
      nationalID: this.nationalID,
      _id: this._id,
      user_id: this._id,
    };

    if (oldToken) {
      const decodedToken = jwt.verify(oldToken, AUTH_SECRET);
      const decodedTokenData = decodedToken.data;
      newTokenData = {
        ...newTokenData,
        ...decodedTokenData,
      };
    }

    if (data) {
      const filteredData = JSON.parse(
        JSON.stringify(data, [
          "isMobileAuthorized",
          "is2FAAuthorized",
          "pwd_verify_exp_at",
          "phone_verify_exp_at",
          "twoFA_verify_exp_at",
        ])
      );
      newTokenData = {
        ...newTokenData,
        ...filteredData,
      };
    }

    const newToken = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60, //1hour
        data: newTokenData,
      },
      AUTH_SECRET
    );

    await JWTTokenDao.saveTokenWithUseragent(
      newToken,
      this,
      req.useragent,
      getIP(req).clientIp
    );
    if (oldToken) await JWTTokenDao.invalidateToken(oldToken);
    return newToken;
  } catch (error) {
    console.log("Error creating/saving JWT");
  }
  return null;
};

GeneralAccountSchema.methods.getLoggedUser = function () {
  return {
    type: this.type,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    gender: this.gender,
    nationalID: this.nationalID,
    dateOfBirth: this.dateOfBirth,
    phone: this.phone,
    email: this.email,
    street: this.street,
    province: this.province,
    district: this.district,
    country: this.country,
    nationality: this.nationality,
    address: this.address,
    zipCode: this.zipCode,
    imagePaths: this.imagePaths,
    mainAccountID: this.mainAccountID,
    previousAccounts: this.previousAccounts,
    isMobileAuthenticationEnabled: this.isMobileAuthenticationEnabled,
    isTwoFactorEnabled: this.isTwoFactorEnabled,
    isApproved: this.isApproved,
    approvalReason: this.approvalReason,
    isLocked: this.isLocked,
    phone_verified_at: this.phone_verified_at,
    email_verified_at: this.email_verified_at,
  };
};

GeneralAccountSchema.methods.getPublicUser = async function () {
  return {
    type: this.type,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    gender: this.gender,
    nationalID: this.nationalID,
    email: this.email,
    province: this.province,
    district: this.district,
    country: this.country,
    nationality: this.nationality,
    imagePaths: this.imagePaths,
    mainAccountID: this.mainAccountID,
    previousAccounts: this.previousAccounts,
    isApproved: this.isApproved,
    isLocked: this.isLocked,
  };
};

const GeneralAccount = model("general_user", GeneralAccountSchema);
module.exports = GeneralAccount;
