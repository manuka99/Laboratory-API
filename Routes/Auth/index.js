const { GeneralAccountAuthRoutes } = require("./GeneralAuth");
const AuthEndpoint = require("../../Endpoints/AuthEndpoint");

exports.AuthRoutes = (app) => {
  app.post("/api/public/auth-user", AuthEndpoint.GetRequestUser);
  app.post("/api/auth/logout", AuthEndpoint.Logout);
  GeneralAccountAuthRoutes(app);
};
