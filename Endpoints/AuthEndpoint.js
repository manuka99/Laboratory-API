const { sendSuccess } = require("../Common/util");
const JWTTokenDao = require("../Dao/JWTTokenDao");

//to validate token
exports.GetRequestUser = (req, res, next) => {
  return sendSuccess(res, { user: req.user });
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
