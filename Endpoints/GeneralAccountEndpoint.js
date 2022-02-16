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

exports.Registration = (req, res, next) => {
  const {
    firstName,
    lastName,
    nationalID,
    phone,
    email,
    address,
    raw_password,
    raw_transactionPassword,
    imagePaths,
  } = req.body;

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);
  const encrypted_tx_pwd = bcrypt.hashSync(raw_transactionPassword, 12);

  GeneralAccountDao.create({
    firstName,
    lastName,
    nationalID,
    phone,
    email,
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

exports.Login = (req, res, next) => {
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
      var token = await user.getSignedJwtToken(req, false);
      return sendSuccess(res, {
        user,
        message: "Success user login",
        token,
      });
    })
    .catch(next);
};

// post
exports.RecoverPassword = (req, res, next) => {
  const { nationalID } = req.body;

  GeneralAccountDao.findUser({ nationalID }, true)
    .then((user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the provided National ID.",
        });

      if (user.pwd_recovery_token)
        return sendError(res, {
          message:
            "A recovery code has already been sent to this account, please request a new code after 10 minutes.",
        });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(code);
      const hashedCode = sha256(code);

      GeneralAccountDao.update(user._id, {
        pwd_recovery_token: hashedCode,
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
                return sendError(res, {
                  message: "Error when sending authorization code",
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

      const encrypted_pwd = bcrypt.hashSync(raw_password, 12);
      // update password
      GeneralAccountDao.update(user._id, {
        password: encrypted_pwd,
        pwd_recovery_token: null,
      })
        .then(async () => {
          JWTTokenDao.invalidateTokensOfUser(user._id);
          var token = await user.getSignedJwtToken(req, false);
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

// patch
exports.UpdateAccountPassword = (req, res, next) => {
  const { _id } = req.user;
  const { pwd_confirm_exp } = req.user.user_jwt;

  if (!pwd_confirm_exp || pwd_confirm_exp < new Date())
    return sendError(
      res,
      {
        message: "Confirm the account password.",
        code: ErrorCodeEnum.CONFIRM_ACT_PWD,
      },
      403
    );

  const { raw_password } = req.body;

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);

  // update password
  GeneralAccountDao.update(_id, { password: encrypted_pwd })
    .then(async (user) => {
      JWTTokenDao.invalidateTokensOfUser(_id);
      var token = await user.getSignedJwtToken(req, false);
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
exports.UpdateTxPassword = (req, res, next) => {
  const { _id } = req.user;
  const { pwd_confirm_exp } = req.user.user_jwt;

  console.log("pwd_confirm_exp", pwd_confirm_exp);

  if (!pwd_confirm_exp || pwd_confirm_exp < new Date())
    return sendError(
      res,
      {
        message: "Confirm the account password.",
        code: ErrorCodeEnum.CONFIRM_ACT_PWD,
      },
      403
    );

  const { raw_tx_password } = req.body;

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
};

// post
exports.ConfirmPassword = (req, res, next) => {
  const { raw_password } = req.body;
  GeneralAccountDao.findUser({ _id: req.user._id }, true)
    .then((user) => {
      const isMatch = user.matchPasswords(raw_password);
      if (!isMatch)
        return sendError(res, {
          message: "Password is incorrect",
        });

      const pwd_confirm_exp = new Date(new Date().getTime() + 15 * 60000);
      JWTTokenDao.ConfirmPassword(req.user.user_jwt._id, pwd_confirm_exp)
        .then(() =>
          sendSuccess(res, {
            message: "Password was confirmed",
          })
        )
        .catch(() =>
          sendError(res, {
            message: "Failed to confirm password.",
          })
        );
    })
    .catch(() =>
      sendError(res, {
        message: "Error: Account does not exist",
      })
    );
};

exports.Authorize2FA = async (req, res, next) => {
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

  GeneralAccountDao.findUser({ nationalID: loggedUser.nationalID }, true)
    .then(async (user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the provided National ID.",
        });

      const verification_result = twofactor.verifyToken(
        user.two_factor_secret,
        auth_code.toString()
      );
      // match code
      if (verification_result && verification_result.delta == 0) {
        // return jwt token
        user.two_factor_secret = null;
        var token = await user.getSignedJwtToken(req, true);
        return sendSuccess(res, {
          user,
          message: "Success 2fa login",
          token,
        });
      } else
        return sendError(res, {
          message: "Auth code is incorrect",
        });
    })
    .catch(next);
};

exports.Register2FA = (req, res, next) => {
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
        var token = await upUser.getSignedJwtToken(req, true);
        return sendSuccess(res, {
          message:
            "Two factor authentication was successfully activated on this account.",
          token,
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

exports.Revoke2FA = (req, res, next) => {
  const loggedUser = req.user;
  const { pwd_confirm_exp } = req.user.user_jwt;

  if (!pwd_confirm_exp || pwd_confirm_exp < new Date())
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
    .then(() => {
      JWTTokenDao.invalidateToken(req.user.user_jwt.token);
      sendSuccess(res, {
        message:
          "Two factor authentication was successfully deactivated from this account.",
      });
    })
    .catch(() =>
      sendError(res, {
        message:
          "Failed to deactivate two factor authentication on this account. Sign out and try again.",
      })
    );
};
