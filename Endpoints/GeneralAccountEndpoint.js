const { sendSuccess, sendError } = require("../Common/util");
const { SMS_NUMBER, SMS_PASS } = require("../Config");
const GeneralAccountDao = require("../Dao/GeneralAccountDao");
const JWTTokenDao = require("../Dao/JWTTokenDao");
const { ErrorCodeEnum } = require("../Models/ErrorModel");
const twofactor = require("node-2fa");
var sha256 = require("js-sha256");
const axios = require("axios");
const { Validation } = require("../Validation");
const { ValidateRequest } = require("../Middlewares/ValidateRequest");
const bcrypt = require("bcrypt");

const pwd_rtoken_exp_at_minutes = 15;
const phone_vtoken_exp_at_minutes = 15;
const tphone_vtoken_exp_at_minutes = 15;
const email_vtoken_exp_at_minutes = 15;
const pwd_verify_exp_at_minutes = 30;
const phone_verify_exp_at_minutes = 30;
const twoFA_verify_exp_at_minutes = 30;

exports.Registration = async (req, res, next) => {
  const {
    firstName,
    middleName,
    lastName,
    gender,
    nationalID,
    dateOfBirth,
    phone,
    email,
    street,
    province,
    district,
    country,
    nationality,
    zipCode,
    address,
    raw_password,
    raw_transactionPassword,
    imagePaths,
  } = req.body;

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);
  const encrypted_tx_pwd = bcrypt.hashSync(raw_transactionPassword, 12);

  GeneralAccountDao.create({
    firstName,
    middleName,
    lastName,
    gender,
    nationalID,
    dateOfBirth,
    phone,
    email,
    street,
    province,
    district,
    country,
    nationality,
    zipCode,
    address,
    password: encrypted_pwd,
    transactionPassword: encrypted_tx_pwd,
    imagePaths,
  })
    .then(() =>
      sendSuccess(res, {
        message: "Account was created successfully.",
      })
    )
    .catch(next);
};

exports.Login = async (req, res, next) => {
  const { nationalID, raw_password } = req.body;

  // match email
  GeneralAccountDao.findUser({ nationalID }, true)
    .then(async (user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the provided National ID.",
        });

      // match password
      const isMatch = user.matchPasswords(raw_password);
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

  GeneralAccountDao.findUser({ nationalID }, true)
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

      GeneralAccountDao.update(user._id, {
        pwd_recovery_token: hashedCode,
        pwd_rtoken_exp_at,
      })
        .then(() => {
          // send sms
          var smsLink = `https://www.textit.biz/sendmsg/?id=${SMS_NUMBER}&pw=${SMS_PASS}s&to=${user.phone}&text=Code+is+${code}`;
          axios
            .get(smsLink)
            .then((smsRes) => {
              if (smsRes.data && smsRes.data.split(",") > 2)
                return sendSuccess(res, {
                  message: "Authorization code was sent successfully",
                });
              else
                return sendSuccess(res, {
                  message: "Error when sending authorization code " + code,
                });
            })
            .catch(() => {
              return sendError(res, {
                message: "Error when sending authorization code",
              });
            });
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

  const hashed_reset_code = sha256(reset_code.toString());
  // match nic and reset code
  GeneralAccountDao.findUser({
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
      GeneralAccountDao.update(user._id, {
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

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

  GeneralAccountDao.update(loggedUser._id, {
    tphone_verify_token: hashedCode,
    tempPhone: temp_phone,
    tphone_vtoken_exp_at,
  })
    .then((upUser) => {
      // send sms
      var smsLink = `https://www.textit.biz/sendmsg/?id=${SMS_NUMBER}&pw=${SMS_PASS}s&to=${temp_phone}&text=Code+is+${code}`;
      axios
        .get(smsLink)
        .then((smsRes) => {
          if (smsRes.data && smsRes.data.split(",") > 2)
            return sendSuccess(res, {
              message: "Verification code was sent successfully",
              tempPhone: temp_phone,
            });
          else
            return sendSuccess(res, {
              message: "Error when sending verification code " + code,
              user: upUser.getLoggedUser(),
            });
        })
        .catch(() => {
          return sendError(res, {
            message: "Error when sending verification code",
          });
        });
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

  const hashed_verification_code = sha256(verification_code.toString());

  if (
    loggedUser.tphone_verify_token == hashed_verification_code &&
    loggedUser.tphone_vtoken_exp_at > new Date()
  ) {
    // update phone
    GeneralAccountDao.update(loggedUser._id, {
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);

  // update password
  GeneralAccountDao.update(_id, { password: encrypted_pwd })
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

// patch
exports.UpdateTxPassword = async (req, res, next) => {
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

  const { raw_tx_password } = req.body;

  await Validation.text("raw_tx_password", 8, 40).run(req);

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .then(() => {
      const encrypted_pwd = bcrypt.hashSync(raw_tx_password, 12);
      // update password
      GeneralAccountDao.update(_id, { transactionPassword: encrypted_pwd })
        .then(() =>
          sendSuccess(res, {
            message: "Password was updated successfully",
          })
        )
        .catch(() =>
          sendError(res, {
            message: "Error: Password was not updated",
          })
        );
    })
    .catch(next);
};

// post
exports.ConfirmPassword = async (req, res, next) => {
  const loggedUser = req.user;
  const { raw_password } = req.body;

  const isMatch = loggedUser.matchPasswords(raw_password);
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

    GeneralAccountDao.update(loggedUser._id, {
      phone_verify_token: hashedCode,
      phone_vtoken_exp_at,
    })
      .then(() => {
        // send sms
        var smsLink = `https://www.textit.biz/sendmsg/?id=${SMS_NUMBER}&pw=${SMS_PASS}s&to=${loggedUser.phone}&text=Code+is+${code}`;
        axios
          .get(smsLink)
          .then((smsRes) => {
            if (smsRes.data && smsRes.data.split(",") > 2)
              return sendSuccess(res, {
                message: "Verification code was sent successfully",
              });
            else
              return sendSuccess(res, {
                message: "Error when sending verification code " + code,
              });
          })
          .catch(() => {
            return sendError(res, {
              message: "Error when sending verification code",
            });
          });
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

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
  GeneralAccountDao.update(loggedUser._id, {
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

  await Promise.resolve()
    .then(() => ValidateRequest(req))
    .catch(next);

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
    GeneralAccountDao.update(loggedUser._id, {
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

  GeneralAccountDao.update(loggedUser._id, {
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
