const { sendError } = require("../../Common/util");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");

exports.PhoneAuthorized = async (req, res, next) => {
  if (req.user && req.jwtTokenData.isMobileAuthorized) return next();
  return sendError(
    res,
    {
      message:
        "Permission denied: You are not authorized to perform this function. Phone authorization is required, please verify your mobile number",
      code: ErrorCodeEnum.PHONE_AUTH,
    },
    403
  );
};
