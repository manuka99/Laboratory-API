const { sendSuccess } = require("../Common/util");
const GeneralAccountDao = require("../Dao/GeneralAccountDao");
const JWTTokenDao = require("../Dao/JWTTokenDao");
const { UserEnum } = require("../Models/UserModel");

//to validate token
exports.GetRequestUser = async (req, res, next) => {
  const reqUser = req.user;
  var user;
  if (reqUser) {
    const UserDao =
      reqUser.type == UserEnum.GENERAL
        ? GeneralAccountDao
        : reqUser.type == UserEnum.SERVICE
        ? GeneralAccountDao
        : null;

    // fetch user by decoded rtoken user id
    user = await UserDao.findUser({ _id: reqUser._id });
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
