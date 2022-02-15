const { sendError } = require("../Common/util");
const { ErrorCodeEnum } = require("../Models/ErrorModel");

exports.AccountUnlocked = async (req, res, next) => {
  if (req.user && !req.user.isLocked) return next();
  return sendError(
    res,
    {
      message: "Account is locked, please contact the management team for more information!",
      code: ErrorCodeEnum.ACCOUNT_LOCKED,
    },
    403
  );
};
