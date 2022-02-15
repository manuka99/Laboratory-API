const { sendError } = require("../Common/util");
const { ErrorCodeEnum } = require("../Models/ErrorModel");
const { UserEnum } = require("../Models/UserModel");

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
  return sendError(
    res,
    {
      message: "Please sign in to access protected content!",
      code: ErrorCodeEnum.USER_TYPE,
      required: userType,
    },
    403
  );
};
