const { Schema, model, Types } = require("mongoose");
var getIP = require("ipware")().get_ip;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWTTokenDao = require("../../Dao/JWTTokenDao");
const { AUTH_SECRET } = require("../../Config");
const CryptoJS = require("crypto-js");

const UserSchema = new Schema(
  {
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
    phone: {
      type: String,
      select: false
    },
    tempPhone: {
      type: String,
      select: false
    },
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Invalid email type.",
      ],
    },
    password: {
      type: String,
      required: [true, "Password must not be empty."],
      minlength: [8, "Password must have at least 8 characters."],
      select: false, // password will not be retrived unless specified
    },
    transactionSignatureID: {
      type: String,
      select: false,
    },
    transactionSignatureKey: {
      type: String,
      select: false,
    },
    transactionPassword: {
      type: String,
      select: false,
    },
    isMobileAuthenticationEnabled: {
      type: Boolean,
      default: false,
      select: false
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
      select: false
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
        select: false
    },
    approvedBy: {
      type: Types.ObjectId,
      required: false,
      select: false,
      ref: "service_user",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    phone_verified_at: { type: Date, select: false },
    email_verified_at: { type: Date, select: false },

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

UserSchema.methods.matchAccountPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.matchTxPassword = function (tx_password) {
  return bcrypt.compareSync(tx_password, this.transactionPassword);
};

UserSchema.methods.encryptTxSignatureKey = function (
  transactionSignatureKey,
  tx_password
) {
  return CryptoJS.AES.encrypt(transactionSignatureKey, tx_password).toString();
};

UserSchema.methods.decryptTxSignatureKey = function (tx_password) {
  const bytes = CryptoJS.AES.decrypt(this.transactionSignatureKey, tx_password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

UserSchema.methods.matchPasswordRecoveryTokens = function (token) {
  return bcrypt.compareSync(token, this.password_recovery_token);
};

UserSchema.methods.getSignedJwtToken = async function (req, oldToken, data) {
  try {
    var newTokenData = {
      _id: this._id,
      type: this.__t,
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
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, //1hour
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

UserSchema.methods.getLoggedUser = function () {
  return {
    _id: this._id,
    type: this.__t,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    phone: this.phone ? "xxxxxxx" + this.phone.slice(-3) : null,
    tempPhone: this.tempPhone ? "xxxxxxx" + this.tempPhone.slice(-3) : null,
    email: this.email,
    isMobileAuthenticationEnabled: this.isMobileAuthenticationEnabled,
    isTwoFactorEnabled: this.isTwoFactorEnabled,
    isApproved: this.isApproved,
    approvalReason: this.approvalReason,
    isLocked: this.isLocked,
    phone_verified_at: this.phone_verified_at,
    email_verified_at: this.email_verified_at,
    // general
    gender: this.gender,
    nationalID: this.nationalID,
    dateOfBirth: this.dateOfBirth,
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
  };
};

UserSchema.methods.getPublicUser = async function () {
  return {
    type: this.__t,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    email: this.email,
    isApproved: this.isApproved,
    isLocked: this.isLocked,
     // general
    gender: this.gender,
    nationalID: this.nationalID,
    dateOfBirth: this.dateOfBirth,
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
  };
};

const User = model("user", UserSchema);
module.exports = User;
