const { sendError } = require("../../Common/util");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");
const { UserEnum } = require("../../Models/UserModel");

exports.Authenticate = (userType) => async (req, res, next) => {
  if (
    req.user &&
    String(req.user._id).length > 0 &&
    (userType
      ? [UserEnum.GENERAL, UserEnum.SERVICE].includes(userType) &&
        req.user.type == userType
      : true)
  )
    return next();

  const statusCode = req.user ? 403 : 401;
  const message = req.user
    ? "Permission denied: You are not authorized to perform this function"
    : "Please sign in with your National ID to access the requested service";

  return sendError(
    res,
    {
      message,
      code: ErrorCodeEnum.USER_TYPE,
      required: userType,
    },
    statusCode
  );
};
