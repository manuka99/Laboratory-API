const { sendSuccess, sendError } = require("../Common/util");
const JWTTokenDao = require("../Dao/JWTTokenDao");
const geoip = require("geoip-lite");

exports.getUserSessions = async (req, res, next) => {
  try {
    const sessions = await JWTTokenDao.findAllByUserID(req.user._id);
    const current = req.user.user_jwt;
    return sendSuccess(res, { sessions, current });
  } catch (error) {
    next(error);
  }
};

exports.getUserSession = async (req, res, next) => {
  try {
    const session = await JWTTokenDao.findById(req.params.id);
    const current = req.user.user_jwt;
    // const geo_data = geoip.lookup(session.ip_address);
    const geo_data = geoip.lookup("113.59.210.154");
    return sendSuccess(res, { session, current, geo_data });
  } catch (error) {
    next(error);
  }
};

exports.revokeUserSession = (req, res, next) => {
  JWTTokenDao.invalidateTokenByIdAndUser(req.params.id, req.user._id)
    .then(() =>
      sendSuccess(res, {
        message: "Device was revoked successfully.",
      })
    )
    .catch(() =>
      sendError(res, {
        message: "Device was not revoked, please refresh and try again.",
      })
    );
};

exports.revokeAllUserSessions = (req, res, next) => {
  JWTTokenDao.invalidateTokensOfUser(req.user._id)
    .then(async () => {
      var token = await req.user.getSignedJwtToken(req, req.jwtToken);
      sendSuccess(res, {
        message: "All devices were revoked successfully.",
        token,
      });
    })
    .catch(next);
};

exports.revokeSession = (req, res, next) => {
  JWTTokenDao.invalidateTokenById(req.params.id)
    .then((jwtToken) => sendSuccess(res, jwtToken))
    .catch(next);
};

exports.deleteSession = (req, res, next) => {
  JWTTokenDao.deleteById(req.params.id)
    .then((jwtToken) => sendSuccess(res, jwtToken))
    .catch(next);
};

exports.deleteAllInvalidUserSession = (req, res, next) => {
  JWTTokenDao.deleteAllInvalidTokensOfUser(req.user._id)
    .then(() =>
      sendSuccess(res, {
        message: "All revoked devices were removed successfully.",
      })
    )
    .catch(next);
};

exports.deleteOneInvalidTokenOfUser = (req, res, next) => {
  JWTTokenDao.deleteOneInvalidTokenOfUser(req.params.id, req.user._id)
    .then(() =>
      sendSuccess(res, {
        message: "Revoked device was removed successfully.",
      })
    )
    .catch(next);
};
