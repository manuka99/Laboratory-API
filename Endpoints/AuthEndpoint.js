const { sendSuccess } = require("../Common/util");
const JWTTokenDao = require("../Dao/JWTTokenDao");

//to validate token
exports.GetRequestUser = async (req, res, next) => {
  const reqUser = req.user;
  var user;
  if (reqUser) {
    user = reqUser.getLoggedUser();
  }
  return sendSuccess(res, { user });
};

exports.Logout = (req, res, next) => {
  JWTTokenDao.invalidateToken(req.user.user_jwt.token)
    .then(() => {})
    .catch(() => {})
    .finally(() =>
      sendSuccess(res, {
        message: "Logged out!",
      })
    );
};
