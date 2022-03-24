const TransactionEP = require("../../Endpoints/TransactionEP");
const RoutesEnum = require("../../Models/RouteModel");
const {
  TxnPwdVerified,
} = require("../../Middlewares/Verification/TxnPasswordVerified");

exports.TransactionRoutes = (router) => {
  router.post(
    `${RoutesEnum.USER}/sign-transaction`,
    TxnPwdVerified,
    TransactionEP.SignTransaction
  );

  router.post(
    `${RoutesEnum.USER}/create-temp-transaction`,
    TransactionEP.CreateTempTxn
  );

  router.post(`${RoutesEnum.USER}/add-sign`, TransactionEP.AddSign);

  router.post(`${RoutesEnum.USER}/remove-sign`, TransactionEP.RemoveSign);

  router.post(
    `${RoutesEnum.USER}/signature-acceptance`,
    TransactionEP.AcceptRejectSign
  );

  router.get(
    `${RoutesEnum.USER}/find-created-transactions`,
    TransactionEP.FindCreatedTransactions
  );

  router.get(
    `${RoutesEnum.USER}/find-shared-transactions`,
    TransactionEP.FindSharedTransactions
  );

  router.get(
    `${RoutesEnum.USER}/find-transactions`,
    TransactionEP.FindTransactions
  );
};
