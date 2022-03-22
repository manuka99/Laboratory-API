const AuthEndpoint = require("../../../Endpoints/AuthEndpoint");
const GeneralAccountEndpoint = require("../../../Endpoints/GeneralAccountEndpoint");
const {
  ActPwdVerified,
} = require("../../../Middlewares/Verification/PasswordVerified");
const RoutesEnum = require("../../../Models/RouteModel");

exports.AccountAuthRoutes = (router) => {
  /* Guest Routes */
  router.post(`${RoutesEnum.GUEST_GENERAL}/login`, AuthEndpoint.Login);
  router.post(
    `${RoutesEnum.GUEST_GENERAL}/recover-password`,
    AuthEndpoint.RecoverPassword
  );
  router.patch(
    `${RoutesEnum.GUEST_GENERAL}/reset-password`,
    AuthEndpoint.ResetPassword
  );
  router.patch(
    `${RoutesEnum.AUTH_GENERAL}/update-temp-phone`,
    ActPwdVerified,
    AuthEndpoint.UpdateTempPhone
  );
  router.patch(
    `${RoutesEnum.AUTH_GENERAL}/update-phone`,
    AuthEndpoint.VerifyAndUpdatePhone
  );

  /* Authorized Routes */
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-password`,
    AuthEndpoint.ConfirmPassword
  );
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-phone-request`,
    AuthEndpoint.ConfirmMobileRequest
  );
  router.post(
    `${RoutesEnum.AUTH_GENERAL}/verify-phone`,
    AuthEndpoint.ConfirmMobile
  );
  router.post(`${RoutesEnum.AUTH_GENERAL}/verify-2fa`, AuthEndpoint.Confirm2FA);
  router.post(
    `${RoutesEnum.GENERAL}/register2fa`,
    ActPwdVerified,
    AuthEndpoint.Register2FA
  );
  router.post(
    `${RoutesEnum.GENERAL}/activate2fa`,
    ActPwdVerified,
    AuthEndpoint.Activate2FA
  );

  // General
  router.patch(
    `${RoutesEnum.GENERAL}/update-password`,
    ActPwdVerified,
    AuthEndpoint.UpdateAccountPassword
  );
  router.post(`${RoutesEnum.GENERAL}/revoke2fa`, AuthEndpoint.Revoke2FA);

  // Email update and send code
  router.post(
    `${RoutesEnum.GENERAL}/verify-email-request`,
    AuthEndpoint.VerifyEmailRequest
  );

  router.get(
    `${RoutesEnum.PUBLIC_GENERAL}verify-email`,
    AuthEndpoint.VerifyEmailAndUpdate
  );
};
