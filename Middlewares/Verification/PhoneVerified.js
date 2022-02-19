const { sendError } = require("../../Common/util");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");

exports.PhoneVerified = async (req, res, next) => {
  if (req.user && req.jwtTokenData.phone_verify_exp_at > new Date())
    return next();
  return sendError(
    res,
    {
      message: "Phone is not verified, please verify your mobile number",
      code: ErrorCodeEnum.PHONE_VERIFICATION,
    },
    403
  );
};
