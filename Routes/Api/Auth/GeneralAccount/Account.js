const GeneralAccountEndpoint = require("../../../../Endpoints/GeneralAccountEndpoint");
const {
  ActPwdVerified,
} = require("../../../../Middlewares/Verification/PasswordVerified");
const RoutesEnum = require("../../../../Models/RouteModel");
exports.GeneralAccountAuthRoutes = (router) => {
  /* Guest Routes */
  router.post(
    `${RoutesEnum.GUEST_GENERAL}/login`,
    GeneralAccountEndpoint.Login
  );
  router.post(
    `${RoutesEnum.GUEST_GENERAL}/recover-password`,
    GeneralAccountEndpoint.RecoverPassword
  );
  router.patch(
    `${RoutesEnum.GUEST_GENERAL}/reset-password`,
    GeneralAccountEndpoint.ResetPassword
  );
  router.patch(
    `${RoutesEnum.AUTH_GENERAL}/update-temp-phone`,
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTempPhone
  );
  router.patch(
    `${RoutesEnum.AUTH_GENERAL}/update-phone`,
    GeneralAccountEndpoint.VerifyAndUpdatePhone
  );

  /* Authorized Routes */
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-password`,
    GeneralAccountEndpoint.ConfirmPassword
  );
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-phone-request`,
    GeneralAccountEndpoint.ConfirmMobileRequest
  );
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-phone`,
    GeneralAccountEndpoint.ConfirmMobile
  );
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-2fa`,
    GeneralAccountEndpoint.Confirm2FA
  );
  router.post(
    `${RoutesEnum.GENERAL}/register2fa`,
    ActPwdVerified,
    GeneralAccountEndpoint.Register2FA
  );
  router.post(
    `${RoutesEnum.GENERAL}/activate2fa`,
    ActPwdVerified,
    GeneralAccountEndpoint.Activate2FA
  );

  // General
  router.patch(
    `${RoutesEnum.GENERAL}/update-password`,
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateAccountPassword
  );
  router.post(
    `${RoutesEnum.GENERAL}/revoke2fa`,
    GeneralAccountEndpoint.Revoke2FA
  );

  // Email update and send code
  router.post(
    `${RoutesEnum.GENERAL}/verify-email-request`,
    GeneralAccountEndpoint.VerifyEmailRequest
  );

  router.get(
    `${RoutesEnum.PUBLIC_GENERAL}verify-email`,
    GeneralAccountEndpoint.VerifyEmailAndUpdate
  );

  // Admin
  router.post(
    `${RoutesEnum.ADMIN_GENERAL}registration`,
    GeneralAccountEndpoint.Registration
  );
};
