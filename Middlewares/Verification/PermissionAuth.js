const { sendError } = require("../../Common/util");

exports.RoleAuth = (roles) => (req, res, next) => {
  var hasRole = roles.includes(req.user.role);
  if (!hasRole) {
    sendError(
      res,
      {
        message:
          "Permission denied: You are not authorized to perform this function.",
      },
      403
    );
    return false;
  } else if (hasRole && next) next();
  else return hasRole;
};
