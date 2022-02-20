const { AuthRoutes } = require("./Auth");
const { ExplorerRoutes } = require("./Explorer");
const { SessionRoutes } = require("./Session");

exports.AppRoutes = (app) => {
  // Authentication Routes
  AuthRoutes(app);

  // Explorer Routes
  ExplorerRoutes(app);

  // Session Routes
  SessionRoutes(app);

  // Invalid Routes
  // app.use("*", (req, res) => sendError(res, "Resource not found!"));
};
