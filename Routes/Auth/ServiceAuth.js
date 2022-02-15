const AuthEndpoint = require("../../Endpoints/AuthEndpoint");

exports.AuthRoutes = (app) => {
  /* Public Routes */
  app.get("/api/public/validate-token", AuthEndpoint.GetRequestUser);
  app.post("/api/guest/login", AuthEndpoint.Login);
  app.post("/api/guest/recover-password", AuthEndpoint.RecoverPassword);
  app.patch("/api/guest/reset-password", AuthEndpoint.ResetPassword);
  
  /* Authenticated Routes */
  app.post("/api/admin/registration", AuthEndpoint.Registration);
  // app.get("/api/auth/profile", AuthEndpoint.GetUserProfile);
  // app.post("/api/auth/2fa-code", AuthEndpoint.Authorize2FACode);
  // app.post("/api/auth/logout", AuthEndpoint.Logout);
};
