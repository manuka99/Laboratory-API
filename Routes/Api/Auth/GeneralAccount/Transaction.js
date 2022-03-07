const GeneralAccountEndpoint = require("../../../../Endpoints/GeneralAccountEndpoint");
const {
  ActPwdVerified,
} = require("../../../../Middlewares/Verification/PasswordVerified");

exports.GeneralTransactionAuthRoutes = (router) => {
  /* Guest Routes */

  /* Authorized Routes */

  // General

  router.patch(
    "/api/general/update-tx-password",
    ActPwdVerified,
    GeneralAccountEndpoint.UpdateTxPassword
  );

  // Admin
};
