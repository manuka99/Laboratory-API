const GeneralAccountEndpoint = require("../../Endpoints/GeneralAccountEndpoint");
const {
  ActPwdVerified,
} = require("../../Middlewares/Verification/PasswordVerified");

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
  app.patch(
    "/api/auth/general/update-temp-phone",
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTempPhone
  );
  app.patch(
    "/api/auth/general/update-phone",
    GeneralAccountEndpoint.VerifyAndUpdatePhone
  );

  /* Authorized Routes */
  app.post(
    "/api/auth/general/verify-password",
    GeneralAccountEndpoint.ConfirmPassword
  );
  app.post(
    "/api/auth/general/verify-phone-request",
    GeneralAccountEndpoint.ConfirmMobileRequest
  );
  app.post(
    "/api/auth/general/verify-phone",
    GeneralAccountEndpoint.ConfirmMobile
  );
  app.post("/api/auth/general/verify-2fa", GeneralAccountEndpoint.Confirm2FA);
  app.post(
    "/api/general/register2fa",
    ActPwdVerified,
    GeneralAccountEndpoint.Register2FA
  );
  app.post(
    "/api/general/activate2fa",
    ActPwdVerified,
    GeneralAccountEndpoint.Activate2FA
  );

  // General
  app.patch(
    "/api/general/update-password",
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateAccountPassword
  );
  app.patch(
    "/api/general/update-tx-password",
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTxPassword
  );
  app.post("/api/general/revoke2fa", GeneralAccountEndpoint.Revoke2FA);

  // Email update and send code
  app.post("/api/general/verify-email-request", GeneralAccountEndpoint.VerifyEmailRequest);
  
  app.get("/api/public/general/verify-email", GeneralAccountEndpoint.VerifyEmailAndUpdate);

  // Admin
  app.post(
    "/api/admin/general/registration",
    GeneralAccountEndpoint.Registration
  );
};
