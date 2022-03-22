const AuthEndpoint = require("../../../Endpoints/AuthEndpoint");
const {
  ActPwdVerified,
} = require("../../../Middlewares/Verification/PasswordVerified");
const RoutesEnum = require("../../../Models/RouteModel");
const {
  TxnPwdVerified,
} = require("../../../Middlewares/Verification/TxnPasswordVerified");


exports.TransactionAuthRoutes = (router) => {
  /* Authorized Routes */

  // General
  router.get(
    `${RoutesEnum.GENERAL}/tx-confirm`,
    TxnPwdVerified,
    AuthEndpoint.ConfirmTxSecurity
  );

  router.get(
    `${RoutesEnum.GENERAL}/tx-security`,
    ActPwdVerified,
    AuthEndpoint.GetTxSecurityInfo
  );

  router.patch(
    `${RoutesEnum.GENERAL}/tx-password`,
    ActPwdVerified,
    AuthEndpoint.UpdateTxPassword
  );

  router.patch(
    `${RoutesEnum.GENERAL}/tx-signature`,
    ActPwdVerified,
    AuthEndpoint.UpdateTxSignature
  );

  router.delete(
    `${RoutesEnum.GENERAL}/reset-tx-signature`,
    ActPwdVerified,
    AuthEndpoint.ResetTransactionSignature
  );
  // Admin
};
