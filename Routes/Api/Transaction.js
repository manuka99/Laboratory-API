const TransactionEP = require("../../Endpoints/TransactionEP");
const RoutesEnum = require("../../Models/RouteModel");
const {
  TxnPwdVerified,
} = require("../../Middlewares/Verification/TxnPasswordVerified");

exports.TransactionRoutes = (router) => {
  // router.get(
  //   `${RoutesEnum.GENERAL}/blockchain-account`,
  //   TransactionEP.FindBlockchainAccounts
  // );
  // router.get(
  //   `${RoutesEnum.GENERAL}/blockchain-account/:id`,
  //   TransactionEP.FindBlockchainAccount
  // );
  router.post(
    `${RoutesEnum.USER}/sign-transaction`,
    TxnPwdVerified,
    TransactionEP.SignTransaction
  );
  // router.patch(
  //   `${RoutesEnum.GENERAL}/blockchain-account/:id`,
  //   TransactionEP.UpdateBlockchainAccountInfo
  // );
  // router.patch(
  //   `${RoutesEnum.GENERAL}/unlock-blockchain-account/:id`,
  //   TransactionEP.UnLockBlockchainAccount
  // );
  // router.delete(
  //   `${RoutesEnum.GENERAL}/blockchain-account/:id`,
  //   TransactionEP.RemoveBlockchainAccount
  // );
};
