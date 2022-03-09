const SessionEndpoint = require("../../../Endpoints/SessionEndpoint");
const RoutesEnum = require("../../../Models/RouteModel");

exports.GeneralSessionRoutes = (router) => {
  router.get(`${RoutesEnum.GENERAL}/sessions`, SessionEndpoint.getUserSessions);
  router.get(
    `${RoutesEnum.GENERAL}/sessions/:id`,
    SessionEndpoint.getUserSession
  );
  router.post(
    `${RoutesEnum.GENERAL}/revoke-sessions`,
    SessionEndpoint.revokeAllUserSessions
  );
  router.post(
    `${RoutesEnum.GENERAL}/revoke-sessions/:id`,
    SessionEndpoint.revokeUserSession
  );
  router.delete(
    `${RoutesEnum.GENERAL}/sessions`,
    SessionEndpoint.deleteAllInvalidUserSession
  );
  router.delete(
    `${RoutesEnum.GENERAL}/sessions/:id`,
    SessionEndpoint.deleteOneInvalidTokenOfUser
  );
};
