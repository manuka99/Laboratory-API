const { AuthRoutes } = require("./Auth");

exports.AppRoutes = (app) => {
  // Authentication Routes
  AuthRoutes(app);
  // Invalid Routes
  // app.use("*", (req, res) => sendError(res, "Resource not found!"));
};
