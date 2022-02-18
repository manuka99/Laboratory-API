const { sendError } = require("../Common/util");
const { ErrorCodeEnum } = require("../Models/ErrorModel");

exports.PhoneVerified = async (req, res, next) => {
  if (req.user && req.jwtTokenData.isMobileAuthorized) return next();
  return sendError(
    res,
    {
      message: "Phone is not verified, please verify your mobile number",
      code: ErrorCodeEnum.PHONE_VERIFICATION,
    },
    403
  );
};
