const { sendError } = require("../Common/util");

exports.GuestUser = (req, res, next) => {
  if (req.user)
    return sendError(res, { message: "You are already authenticated!" });
  else return next();
};
