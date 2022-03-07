const GeneralAccountEndpoint = require("../../../../Endpoints/GeneralAccountEndpoint");
const {
  ActPwdVerified,
} = require("../../../../Middlewares/Verification/PasswordVerified");
const RoutesEnum = require("../../../../Models/RouteModel");

exports.GeneralTransactionAuthRoutes = (router) => {
  /* Authorized Routes */

  // General
  router.get(
    `${RoutesEnum.GENERAL}/tx-security`,
    ActPwdVerified,
    GeneralAccountEndpoint.GetTxSecurityInfo
  );

  router.patch(
    `${RoutesEnum.GENERAL}/tx-password`,
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTxPassword
  );

  router.patch(
    `${RoutesEnum.GENERAL}/tx-signature`,
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTxSignature
  );

  router.delete(
    `${RoutesEnum.GENERAL}/reset-tx-signature`,
    ActPwdVerified,
    GeneralAccountEndpoint.ResetTransactionSignature
  );
  // Admin
};
