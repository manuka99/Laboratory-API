const { AuthRoutes } = require("./Auth");
const { ExplorerRoutes } = require("./Explorer");

exports.AppRoutes = (app) => {
  // Authentication Routes
  AuthRoutes(app);

  // Explorer Routes
  ExplorerRoutes(app);

  // Invalid Routes
  // app.use("*", (req, res) => sendError(res, "Resource not found!"));
};
