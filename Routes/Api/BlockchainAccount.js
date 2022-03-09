const BlockchainAccountEP = require("../../Endpoints/BlockchainAccountEP");
const RoutesEnum = require("../../../Models/RouteModel");

exports.BlockchainAccountRoutes = (router) => {
  router.get(
    `${RoutesEnum.GENERAL}/blockchain-account`,
    BlockchainAccountEP.FindBlockchainAccounts
  );
  router.get(
    `${RoutesEnum.GENERAL}/blockchain-account/:id`,
    BlockchainAccountEP.FindBlockchainAccount
  );
  router.post(
    `${RoutesEnum.GENERAL}/blockchain-account`,
    BlockchainAccountEP.CreateBlockchainAccount
  );
  router.patch(
    `${RoutesEnum.GENERAL}/blockchain-account/:id`,
    BlockchainAccountEP.UpdateBlockchainAccountInfo
  );
  router.patch(
    `${RoutesEnum.GENERAL}/unlock-blockchain-account/:id`,
    BlockchainAccountEP.UnLockBlockchainAccount
  );
  router.delete(
    `${RoutesEnum.GENERAL}/blockchain-account/:id`,
    BlockchainAccountEP.RemoveBlockchainAccount
  );
};
