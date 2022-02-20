const { sendError } = require("../../Common/util");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");

exports.ActPwdVerified = async (req, res, next) => {
  console.log(req.jwtTokenData.pwd_verify_exp_at, new Date())
  if (req.user && new Date(req.jwtTokenData.pwd_verify_exp_at) > new Date())
    return next();
  return sendError(
    res,
    {
      message:
        "Permission denied: You are not authorized to perform this function. Password Verification is required.",
      code: ErrorCodeEnum.PASSWORD_VERIFICATION,
    },
    403
  );
};
