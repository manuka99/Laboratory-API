const { sendError } = require("../../Common/util");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");

exports.AccountApproved = async (req, res, next) => {
  if (req.user && req.user.isApproved) return next();
  return sendError(
    res,
    {
      message:
        "Account is not approved, please contact the management team for more information!",
      code: ErrorCodeEnum.ACCOUNT_APPROVAL,
    },
    403
  );
};
