const { sendError } = require("../Common/util");
const { ErrorCodeEnum } = require("../Models/ErrorModel");

exports.TwoFactorAuthorized = async (req, res, next) => {
  if (req.user && (!req.user.isTwoFactorEnabled || req.jwtTokenData.is2FAAuthorized))
    return next();
  return sendError(
    res,
    {
      message: "Please sign in to access protected content!",
      code: ErrorCodeEnum.TWO_FACTOR_AUTH,
    },
    403
  );
};
