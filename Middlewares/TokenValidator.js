var jwt = require("jsonwebtoken");
const GeneralAccountDao = require("../Dao/GeneralAccountDao");
const JWTTokenDao = require("../Dao/JWTTokenDao");
const { AUTH_SECRET } = require("../Config/index");
var getIP = require("ipware")().get_ip;
const { UserEnum } = require("../Models/UserModel");

// decode jwt token (if present) then if the jwt token is valid request will be authenticated
exports.TokenValidator = async (req, res, next) => {
  try {
    // access token in request (bearer token)
    var token = String(req.header("authorization")).slice(7);

    // verify and decode token to get data
    const decodedToken = jwt.verify(token, AUTH_SECRET);

    const decodedUserData = decodedToken.data;
    const UserDao =
      decodedUserData.type == UserEnum.GENERAL
        ? GeneralAccountDao
        : decodedUserData.type == UserEnum.SERVICE
        ? GeneralAccountDao
        : null;

    if (!UserDao) throw new Error("Invalid user type!");

    // fetch user by decoded rtoken user id
    const user = await UserDao.findUser({ _id: decodedUserData.user_id }, true);

    // invalid user
    if (!user) throw new Error("Invalid user!");

    // check if token was revoked, if so do not set auth user
    const jwtToken = await JWTTokenDao.findByToken(token, true);

    // check if jwtToken is revoked
    if (jwtToken && !jwtToken.isValid)
      throw new Error("Using a revoked authorization token");

    if (jwtToken && jwtToken.ip_address != getIP(req).clientIp) {
      JWTTokenDao.invalidateToken(token);
      throw new Error("Token being used by a another ip/device");
    }

    // user is authenicated, used by other middlewares to verify role etc
    req.user = user;
    req.user.user_jwt = jwtToken;
    req.jwtToken = token;
    req.jwtTokenData = decodedUserData;
    req.user.is2FAAuthorized = decodedUserData.is2FAAuthorized;

    // save the user's token with user agent
    JWTTokenDao.saveTokenWithUseragent(
      token,
      user,
      req.useragent,
      getIP(req).clientIp
    );
  } catch (error) {
    console.error(`TokenValidator Middleware: ${error.message}`);
  } finally {
    next();
  }
};
