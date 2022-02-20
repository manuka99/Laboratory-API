const SessionEndpoint = require("../../Endpoints/SessionEndpoint");

exports.GeneralSessionRoutes = (app) => {
  app.get("/api/general/sessions", SessionEndpoint.getUserSessions);
  app.get("/api/general/sessions/:id", SessionEndpoint.getUserSession);
  app.post(
    "/api/general/revoke-sessions",
    SessionEndpoint.revokeAllUserSessions
  );
  app.post(
    "/api/general/revoke-sessions/:id",
    SessionEndpoint.revokeUserSession
  );
  app.delete(
    "/api/general/sessions",
    SessionEndpoint.deleteAllInvalidUserSession
  );
};
