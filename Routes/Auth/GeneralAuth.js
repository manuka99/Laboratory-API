const GeneralAccountEndpoint = require("../../Endpoints/GeneralAccountEndpoint");

exports.GeneralAccountAuthRoutes = (app) => {
  /* Guest Routes */
  app.post("/api/guest/general/login", GeneralAccountEndpoint.Login);
  app.post(
    "/api/guest/general/recover-password",
    GeneralAccountEndpoint.RecoverPassword
  );
  app.patch(
    "/api/guest/general/reset-password",
    GeneralAccountEndpoint.ResetPassword
  );

  app.post(
    "/api/auth/general/update-temp-phone",
    GeneralAccountEndpoint.UpdateTempPhone
  );

  app.patch(
    "/api/public/general/update-phone",
    GeneralAccountEndpoint.VerifyAndUpdatePhone
  );

  /* Authorized Routes */
  app.post(
    "/api/auth/general/authorize2fa",
    GeneralAccountEndpoint.Authorize2FA
  );
  app.post("/api/auth/general/register2fa", GeneralAccountEndpoint.Register2FA);
  app.post("/api/auth/general/activate2fa", GeneralAccountEndpoint.Activate2FA);

  // General
  app.patch(
    "/api/general/update-password",
    GeneralAccountEndpoint.UpdateAccountPassword
  );
  app.patch(
    "/api/general/update-tx-password",
    GeneralAccountEndpoint.UpdateTxPassword
  );
  app.post(
    "/api/general/confirm-password",
    GeneralAccountEndpoint.ConfirmPassword
  );
  app.post("/api/general/revoke2fa", GeneralAccountEndpoint.Revoke2FA);

  // Admin
  app.post(
    "/api/admin/general/registration",
    GeneralAccountEndpoint.Registration
  );
};
