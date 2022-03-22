const { sendSuccess, sendError } = require("../Common/util");
const JWTTokenDao = require("../Dao/JWTTokenDao");
const UserAccountDao = require("../Dao/UserAccountDao")();
const { ErrorCodeEnum } = require("../Models/ErrorModel");
const twofactor = require("node-2fa");
var sha256 = require("js-sha256");
const {
  UpdateTxSignatureForAllUserBlockchainAccountsFn,
  ForceRemoveAllUserBlockchainAccounts,
} = require("./BlockchainAccountEP");
const { Validation } = require("../Validation");
const { ValidateRequest } = require("../Middlewares/ValidateRequest");
const bcrypt = require("bcrypt");
const { sendSms } = require("../Util/SmsService");
const { sendMail } = require("../Util/MailService");
const RSA = require("../Util/RSA.service");

const pwd_rtoken_exp_at_minutes = 15;
const phone_vtoken_exp_at_minutes = 15;
const tphone_vtoken_exp_at_minutes = 15;
const email_vtoken_exp_at_minutes = 15;
const pwd_verify_exp_at_minutes = 30;
const phone_verify_exp_at_minutes = 30;
const twoFA_verify_exp_at_minutes = 30;

//to validate token
exports.GetRequestUser = async (req, res, next) => {
  const reqUser = req.user;
  var user;
  if (reqUser) {
    user = reqUser.getLoggedUser();
  }
  return sendSuccess(res, { user });
};

exports.Logout = (req, res, next) => {
  JWTTokenDao.invalidateToken(req.user.user_jwt.token)
    .then(() => {})
    .catch(() => {})
    .finally(() =>
      sendSuccess(res, {
        message: "Logged out!",
      })
    );
};

// auth

exports.Login = async (req, res, next) => {
  const { nationalID, raw_password } = req.body;

  // match email
  UserAccountDao.findUser({ nationalID }, true)
    .then(async (user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the provided National ID.",
        });

      // match password
      const isMatch = user.matchAccountPassword(raw_password);
      if (!isMatch)
        return sendError(res, {
          message: "Password is incorrect",
        });

      // return jwt token
      user.password = null;
      var token = await user.getSignedJwtToken(req, false, {
        // pwd_verify_exp_at: new Date(new Date().getTime() + 60000 * 30),
      });
      return sendSuccess(res, {
        message: "Success user login",
        token,
        user: user.getLoggedUser(),
      });
    })
    .catch(next);
};

// post
exports.RecoverPassword = async (req, res, next) => {
  const { nationalID } = req.body;

  UserAccountDao.findUser({ nationalID }, true)
    .then((user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the provided National ID.",
        });

      if (user.pwd_recovery_token && user.pwd_rtoken_exp_at > new Date())
        return sendError(res, {
          message: `A recovery code has already been sent to this account, please request a new code after ${pwd_rtoken_exp_at_minutes} minutes.`,
        });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = sha256(code);
      const pwd_rtoken_exp_at = new Date(
        new Date().getTime() + 60 * 1000 * pwd_rtoken_exp_at_minutes
      ); //in milliseconds

      UserAccountDao.update(user._id, {
        pwd_recovery_token: hashedCode,
        pwd_rtoken_exp_at,
      })
        .then(() => {
          // send sms
          sendSms({ to: user.phone, body: `text=Code+is+${code}` })
            .then(() =>
              sendSuccess(res, {
                message: "Authorization code was sent successfully",
              })
            )
            .catch(() =>
              sendError(res, {
                message: "Error when sending authorization code " + code,
              })
            );
        })
        .catch(() =>
          sendError(res, {
            message:
              "Error when generating authorization code, try again latter.",
          })
        );
    })
    .catch(() =>
      sendError(res, {
        message: "No account associated with the provided National ID.",
      })
    );
};

// post
exports.ResetPassword = async (req, res, next) => {
  const { reset_code, nationalID, raw_password } = req.body;

  await Validation.number("reset_code", 6, 6).run(req);
  await Validation.text("nationalID", 4, 20).run(req);
  await Validation.text("raw_password", 8, 20).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  const hashed_reset_code = sha256(reset_code.toString());
  // match nic and reset code
  UserAccountDao.findUser({
    nationalID,
    pwd_recovery_token: hashed_reset_code,
  })
    .then((user) => {
      if (!user)
        return sendError(res, {
          message:
            "No account associated with the provided National ID/Reset Code",
        });

      if (user.pwd_rtoken_exp_at > new Date())
        return sendError(res, {
          message: "This recovery code has been expired, request another code.",
        });

      const encrypted_pwd = bcrypt.hashSync(raw_password, 12);
      // update password
      UserAccountDao.update(user._id, {
        password: encrypted_pwd,
        pwd_recovery_token: null,
        pwd_rtoken_exp_at: null,
      })
        .then(async () => {
          JWTTokenDao.invalidateTokensOfUser(user._id);
          var token = await user.getSignedJwtToken(req);
          return sendSuccess(res, {
            user,
            message: "Password was updated successfully",
            token,
          });
        })
        .catch(() =>
          sendError(res, {
            message: "Error: Password was not updated",
          })
        );
    })
    .catch(() =>
      sendError(res, {
        message:
          "No account associated with the provided National ID/Reset Code",
      })
    );
};

// post
exports.UpdateTempPhone = async (req, res, next) => {
  const loggedUser = req.user;
  const { temp_phone } = req.body;

  await Validation.number("temp_phone", 9, 13).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  if (
    loggedUser.tempPhone == temp_phone &&
    loggedUser.tphone_verify_token &&
    loggedUser.tphone_vtoken_exp_at > new Date()
  )
    return sendError(res, {
      message: `A verfication code has already been sent to this device, please request a new code after ${tphone_vtoken_exp_at_minutes} minutes.`,
    });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = sha256(code);
  const tphone_vtoken_exp_at = new Date(
    new Date().getTime() + 60 * 1000 * tphone_vtoken_exp_at_minutes
  ); //in milliseconds

  UserAccountDao.update(loggedUser._id, {
    tphone_verify_token: hashedCode,
    tempPhone: temp_phone,
    tphone_vtoken_exp_at,
  })
    .then((upUser) => {
      // send sms
      sendSms({ to: temp_phone, body: `text=Code+is+${code}` })
        .then(() =>
          sendSuccess(res, {
            message: "Verification code was sent successfully",
            tempPhone: temp_phone,
          })
        )
        .catch(() =>
          sendError(res, {
            message: "Error when sending verification code " + code,
            user: upUser.getLoggedUser(),
          })
        );
    })
    .catch(() =>
      sendError(res, {
        message: "Error when generating verification code, try again latter.",
      })
    );
};

// patch
exports.VerifyAndUpdatePhone = async (req, res, next) => {
  const loggedUser = req.user;
  const { phone_verify_exp_at } = req.jwtTokenData;

  if (
    loggedUser.isMobileAuthenticationEnabled &&
    (!phone_verify_exp_at || phone_verify_exp_at < new Date())
  )
    return sendError(
      res,
      {
        message: "Phone is not verified, please verify your mobile number",
        code: ErrorCodeEnum.PHONE_VERIFICATION,
      },
      403
    );

  const { verification_code } = req.body;

  await Validation.number("verification_code", 6, 6).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  const hashed_verification_code = sha256(verification_code.toString());

  if (
    loggedUser.tphone_verify_token == hashed_verification_code &&
    loggedUser.tphone_vtoken_exp_at > new Date()
  ) {
    // update phone
    UserAccountDao.update(loggedUser._id, {
      phone: req.user.tempPhone,
      isMobileAuthenticationEnabled: true,
      tempPhone: null,
      tphone_verify_token: null,
      tphone_vtoken_exp_at: null,
      phone_verified_at: new Date(),
    })
      .then(async () => {
        var token = await loggedUser.getSignedJwtToken(req, req.jwtToken, {
          isMobileAuthorized: true,
          phone_verify_exp_at: new Date(
            new Date().getTime() + 60000 * phone_verify_exp_at_minutes
          ),
        });
        return sendSuccess(res, {
          message: "Phone number was updated successfully",
          token,
        });
      })
      .catch(() =>
        sendError(res, {
          message: "Error: Phone number was not updated",
        })
      );
  } else
    sendError(res, {
      message: "Verification Code does not match or expired",
    });
};

// patch
exports.UpdateAccountPassword = async (req, res, next) => {
  const { _id } = req.user;
  const { pwd_verify_exp_at } = req.jwtTokenData;

  if (!pwd_verify_exp_at || pwd_verify_exp_at < new Date())
    return sendError(
      res,
      {
        message: "Confirm the account password.",
        code: ErrorCodeEnum.CONFIRM_ACT_PWD,
      },
      403
    );

  const { raw_password } = req.body;

  await Validation.text("raw_password", 8, 40).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);

  // update password
  UserAccountDao.update(_id, { password: encrypted_pwd })
    .then(async (user) => {
      JWTTokenDao.invalidateTokensOfUser(_id);
      var token = await user.getSignedJwtToken(req, req.jwtToken);
      return sendSuccess(res, {
        message: "Password was updated successfully",
        token,
      });
    })
    .catch((err) =>
      sendError(res, {
        message: "Error: Password was not updated",
        err,
      })
    );
};

// post
exports.ConfirmPassword = async (req, res, next) => {
  const loggedUser = req.user;
  const { raw_password } = req.body;

  const isMatch = loggedUser.matchAccountPassword(raw_password);
  if (!isMatch)
    return sendError(res, {
      message: "Password is incorrect",
    });

  var token = await loggedUser.getSignedJwtToken(req, req.jwtToken, {
    pwd_verify_exp_at: new Date(
      new Date().getTime() + 60000 * pwd_verify_exp_at_minutes
    ),
  });

  sendSuccess(res, {
    message: "Password was confirmed",
    token,
    user: loggedUser.getLoggedUser(),
  });
};

// post
exports.ConfirmMobileRequest = async (req, res, next) => {
  const loggedUser = req.user;

  if (
    !loggedUser.phone_vtoken_exp_at ||
    loggedUser.phone_vtoken_exp_at < new Date()
  ) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = sha256(code);
    const phone_vtoken_exp_at = new Date(
      new Date().getTime() + 60 * 1000 * phone_vtoken_exp_at_minutes
    );

    UserAccountDao.update(loggedUser._id, {
      phone_verify_token: hashedCode,
      phone_vtoken_exp_at,
    })
      .then(() => {
        // send sms
        sendSms({ to: loggedUser.phone, body: `text=Code+is+${code}` })
          .then(() =>
            sendSuccess(res, {
              message: "Verification code was sent successfully",
            })
          )
          .catch(() =>
            sendError(res, {
              message: "Error when sending verification code " + code,
            })
          );
      })
      .catch(() =>
        sendError(res, {
          message: "Error when generating verification code, try again latter.",
        })
      );
  } else
    sendError(res, {
      message:
        "A verfication code has already been sent to this device, please request a new code after " +
        phone_vtoken_exp_at_minutes +
        " minutes.",
    });
};

// post
exports.ConfirmMobile = async (req, res, next) => {
  const loggedUser = req.user;
  const { verification_code } = req.body;
  await Validation.number("verification_code", 6, 6).run(req);
  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  const hashed_verification_code = sha256(verification_code.toString());

  if (
    loggedUser.phone_verify_token == hashed_verification_code &&
    loggedUser.phone_vtoken_exp_at > new Date()
  ) {
    var token = await loggedUser.getSignedJwtToken(req, req.jwtToken, {
      isMobileAuthorized: true,
      phone_verify_exp_at: new Date(
        new Date().getTime() + 60000 * phone_verify_exp_at_minutes
      ),
    });
    loggedUser.phone_verify_token = null;
    loggedUser.phone_vtoken_exp_at = null;
    loggedUser.save();
    sendSuccess(res, {
      message: "Phone was confirmed successfully",
      token,
      user: loggedUser.getLoggedUser(),
    });
  } else
    sendError(res, {
      message: "Verification Code does not match or expired",
    });
};

exports.Confirm2FA = async (req, res, next) => {
  const loggedUser = req.user;
  const { auth_code } = req.body;
  await Validation.number("auth_code", 6, 6).run(req);
  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  if (!loggedUser.isTwoFactorEnabled)
    return sendError(res, {
      message: "Two factor authentication is not activated for this account",
    });

  const verification_result = twofactor.verifyToken(
    loggedUser.two_factor_secret,
    auth_code.toString()
  );

  if (verification_result && verification_result.delta == 0) {
    var token = await loggedUser.getSignedJwtToken(req, req.jwtToken, {
      is2FAAuthorized: true,
      twoFA_verify_exp_at: new Date(
        new Date().getTime() + 60000 * twoFA_verify_exp_at_minutes
      ),
    });
    sendSuccess(res, {
      message: "Two factor authentication was confirmed successfully",
      token,
      user: loggedUser.getLoggedUser(),
    });
  } else
    sendError(res, {
      message: "Auth Code does not match or expired",
    });
};

exports.Register2FA = async (req, res, next) => {
  const loggedUser = req.user;

  if (loggedUser.isTwoFactorEnabled)
    return sendError(res, {
      message:
        "Two factor authentication is already activated for this account.",
    });

  const newSecret = twofactor.generateSecret({
    name: "METASPECK",
    account: `NIC: ${loggedUser.nationalID}`,
  });
  UserAccountDao.update(loggedUser._id, {
    isTwoFactorEnabled: false,
    two_factor_secret: newSecret.secret,
  })
    .then(() =>
      sendSuccess(res, {
        qr: newSecret.qr,
        message: "Account registered for two factor authentication",
      })
    )
    .catch(() =>
      sendError(res, {
        message:
          "Failed to register two factor authentication on this account. Sign out and try again.",
      })
    );
};

exports.Activate2FA = async (req, res, next) => {
  const loggedUser = req.user;
  const { auth_code } = req.body;

  await Validation.number("auth_code", 6, 6).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  if (!loggedUser.two_factor_secret)
    return sendError(res, {
      message:
        "This account is not yet registered for two factor authentication.",
    });

  if (loggedUser.isTwoFactorEnabled)
    return sendError(res, {
      message:
        "Two factor authentication is already activated for this account",
    });

  const verification_result = twofactor.verifyToken(
    loggedUser.two_factor_secret,
    auth_code.toString()
  );

  // match code
  if (verification_result && verification_result.delta == 0) {
    UserAccountDao.update(loggedUser._id, {
      isTwoFactorEnabled: true,
    })
      .then(async (upUser) => {
        var token = await upUser.getSignedJwtToken(req, req.jwtToken, {
          is2FAAuthorized: true,
          twoFA_verify_exp_at: new Date(new Date().getTime() + 60000 * 30),
        });
        return sendSuccess(res, {
          message:
            "Two factor authentication was successfully activated on this account.",
          token,
          user: upUser.getLoggedUser(),
        });
      })
      .catch(() =>
        sendError(res, {
          message:
            "Failed to activate two factor authentication on this account. Sign out and try again.",
        })
      );
  } else
    return sendError(res, {
      message: "Auth code is incorrect",
    });
};

exports.Revoke2FA = async (req, res, next) => {
  const loggedUser = req.user;
  const { pwd_verify_exp_at } = req.jwtTokenData;

  if (!pwd_verify_exp_at || pwd_verify_exp_at < new Date())
    return sendError(
      res,
      {
        message: "Confirm the account password.",
        code: ErrorCodeEnum.CONFIRM_ACT_PWD,
      },
      403
    );

  if (!loggedUser.isTwoFactorEnabled)
    return sendError(res, {
      message:
        "Two factor authentication is already deactivated for this account.",
    });

  UserAccountDao.update(loggedUser._id, {
    isTwoFactorEnabled: false,
    two_factor_secret: null,
  })
    .then(async (upUser) => {
      var token = await upUser.getSignedJwtToken(req, req.jwtToken, {
        is2FAAuthorized: false,
        twoFA_verify_exp_at: null,
      });
      sendSuccess(res, {
        message:
          "Two factor authentication was successfully deactivated from this account.",
        token,
        user: loggedUser.getLoggedUser(),
      });
    })
    .catch(() =>
      sendError(res, {
        message:
          "Failed to deactivate two factor authentication on this account. Sign out and try again.",
      })
    );
};

// post
exports.VerifyEmailRequest = async (req, res, next) => {
  const loggedUser = req.user;
  const { temp_email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const email_verify_token = sha256(temp_email + code);
  const email_vtoken_exp_at = new Date(
    new Date().getTime() + 60 * 1000 * email_vtoken_exp_at_minutes
  );

  UserAccountDao.update(loggedUser._id, {
    email_verify_token,
    email_vtoken_exp_at,
  })
    .then(() => {
      // send email
      var verificationLink = `${req.protocol}://${req.headers.host}/api/public/general/verify-email?nic=${loggedUser.nationalID}&email=${temp_email}&code=${code}`;
      sendMail({
        to: temp_email,
        subject: "MetaSpeck: Verify Email",
        text: verificationLink,
      })
        .then(() =>
          sendSuccess(res, {
            message: "Verification email was sent successfully",
          })
        )
        .catch(() =>
          sendError(res, {
            message: "Error when sending verification email",
          })
        );
    })
    .catch(() =>
      sendError(res, {
        message: "Error when generating verification code, try again latter.",
      })
    );
};

// get
exports.VerifyEmailAndUpdate = async (req, res, next) => {
  const { nic, email, code } = req.query;
  const email_verify_token = sha256(email + code);
  UserAccountDao.findUser({ nationalID: nic, email_verify_token }, true)
    .then((user) => {
      if (user && user.email_vtoken_exp_at > new Date()) {
        UserAccountDao.update(user._id, {
          email_verify_token: null,
          email_vtoken_exp_at: null,
          email: email,
          email_verified_at: new Date(),
        })
          .then(() =>
            sendSuccess(res, {
              message: "Email was verified successfully",
            })
          )
          .catch(() =>
            sendError(res, {
              message: "Error: Email was not verified.",
            })
          );
      } else
        sendError(res, {
          message: "Error: Invalid verification data or expired",
        });
    })
    .catch(() =>
      sendError(res, {
        message: "Error when generating verification code, try again latter.",
      })
    );
};

//  ************* TRANSACTION SECURITY *****************

// get
exports.ConfirmTxSecurity = (req, res, next) => {
  return sendSuccess(res, {
    message: "Confirmed: Transaction security password.",
  });
};

// get
exports.GetTxSecurityInfo = async (req, res, next) => {
  const { transactionSignatureID, transactionPassword } = req.user;
  const transactionPasswordHash =
    transactionPassword && transactionPassword.length > 0
      ? sha256(transactionPassword)
      : null;

  return sendSuccess(res, {
    // message: "Retrieved: Transaction security information.",
    transactionSignatureID,
    transactionPasswordHash,
  });
};

// patch
exports.UpdateTxPassword = async (req, res, next) => {
  const { transactionSignatureID, transactionPassword } = req.user;
  const { raw_old_tx_password, raw_tx_signature_key, raw_tx_password } =
    req.body;

  await Validation.text("raw_tx_password", 8, 40).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  if (transactionSignatureID) {
    if (raw_old_tx_password) {
      let isMatch = req.user.matchTxPassword(raw_old_tx_password);
      if (isMatch) {
        let tx_signature_key =
          req.user.decryptTxSignatureKey(raw_old_tx_password);
        if (tx_signature_key)
          return UpdateTxPasswordFn(
            req,
            res,
            raw_tx_password,
            tx_signature_key
          );
        else
          return sendError(res, {
            message:
              "Error: Transaction password is invalid, please enter your transaction signature secret",
          });
      } else
        return sendError(res, {
          message: "Error: Incorrect transaction password",
        });
    } else if (raw_tx_signature_key) {
      let isVerified = RSA.IsValidPublicKeyForPrivateKey(
        raw_tx_signature_key,
        transactionSignatureID
      );
      if (isVerified)
        return UpdateTxPasswordFn(
          req,
          res,
          raw_tx_password,
          raw_tx_signature_key
        );
      else
        return sendError(res, {
          message: "Error: Transaction signature key is invalid.",
        });
    } else
      return sendError(res, {
        message:
          "Error: Current transaction password or signature key is required to update transaction password",
      });
  } else {
    if (transactionPassword) {
      if (raw_old_tx_password) {
        let isMatch = req.user.matchTxPassword(raw_old_tx_password);
        if (isMatch) return UpdateTxPasswordFn(req, res, raw_tx_password, null);
        else
          return sendError(res, {
            message:
              "Error: Transaction password is invalid, please enter your transaction password or force reset and create new one.",
          });
      } else
        return sendError(res, {
          message:
            "Error: Current transaction password is required to update transaction password",
        });
    }
    return UpdateTxPasswordFn(req, res, raw_tx_password, null);
  }
};

const UpdateTxPasswordFn = async (
  req,
  res,
  raw_tx_password,
  tx_signature_key
) => {
  const loggedUser = req.user;
  const transactionPassword = bcrypt.hashSync(raw_tx_password, 12);
  const transactionSignatureKey = tx_signature_key
    ? loggedUser.encryptTxSignatureKey(tx_signature_key, raw_tx_password)
    : null;

  // update password
  UserAccountDao.update(loggedUser._id, {
    transactionPassword,
    transactionSignatureKey,
  })
    .then(() =>
      sendSuccess(res, {
        message: "Transaction password was updated successfully",
      })
    )
    .catch(() =>
      sendError(res, {
        message: "Error: Transaction password was not updated",
      })
    );
};

// patch
exports.UpdateTxSignature = async (req, res, next) => {
  const { _id, transactionSignatureID, transactionPassword } = req.user;
  const { current_tx_password, keypair } = req.body;

  await Validation.text("current_tx_password", 8, 40).run(req);
  await Validation.text("keypair", 8, 40).run(req);

  // check transactionPassword on account
  if (!transactionPassword)
    return sendError(res, {
      message:
        "Error: Transaction password is required, please save your transaction password and then continue.",
    });

  // validate transactionPassword
  let isMatch = req.user.matchTxPassword(current_tx_password);

  if (!isMatch)
    return sendError(res, {
      message: "Error: Incorrect transaction password",
    });

  // Validate new transaction signature
  let isVerified = RSA.IsValidPublicKeyForPrivateKey(
    keypair.privateKey,
    keypair.publicKey
  );
  if (!isVerified)
    return sendError(res, {
      message: "Error: Transaction signature keypair is invalid.",
    });

  const newTransactionSignatureID = keypair.publicKey;
  const transactionSignatureKey = req.user.encryptTxSignatureKey(
    keypair.privateKey,
    current_tx_password
  );

  if (!transactionSignatureKey)
    return sendError(res, {
      message: "Error: Unexpected issue, please contact the support team.",
    });

  var failedAccountList;
  if (transactionSignatureID) {
    let tx_signature_key = req.user.decryptTxSignatureKey(current_tx_password);
    if (!tx_signature_key)
      return sendError(res, {
        message:
          "Error: Transaction password is invalid, try after changing your transaction password using the existing signature secret",
      });

    // if has accounts update the signer
    var failedAccountList =
      await UpdateTxSignatureForAllUserBlockchainAccountsFn(
        req.user._id,
        tx_signature_key,
        newTransactionSignatureID
      );

    // if (!result)
    //   return sendError(res, {
    //     message:
    //       "Error: Could not update the transaction signature please try again latter or contact the support team.",
    //   });
  }

  UserAccountDao.update(_id, {
    transactionSignatureID: newTransactionSignatureID,
    transactionSignatureKey,
  })
    .then(() =>
      sendSuccess(res, {
        message: "Transaction signature was saved successfully",
        failedAccountList,
      })
    )
    .catch(() =>
      sendError(res, {
        message: "Error: Transaction signature was not saved",
        failedAccountList,
      })
    );
};

// delete
exports.ResetTransactionSignature = async (req, res, next) => {
  const { _id } = req.user;

  // remove all blockchain accounts
  await ForceRemoveAllUserBlockchainAccounts(_id);

  UserAccountDao.update(_id, {
    transactionPassword: null,
    transactionSignatureID: null,
    transactionSignatureKey: null,
  })
    .then(() =>
      sendSuccess(res, {
        message:
          "All blockchain accounts were removed and transaction signature was reset successfully",
      })
    )
    .catch(() =>
      sendError(res, {
        message: "Error: Transaction signature was not reset",
      })
    );
};
