const { sendSuccess, sendError } = require("../Common/util");
const BlockchainAccountDao = require("../Dao/BlockchainAccountDao");
const RSA = require("../Util/RSA.service");
const { Validation } = require("../Validation");
const { ValidateRequest } = require("../Middlewares/ValidateRequest");

exports.FindBlockchainAccounts = async (req, res, next) => {
  BlockchainAccountDao.FindAccounts({
    userID: req.user._id,
  })
    .then((bcAccounts) =>
      sendSuccess(res, {
        message: `Blockchain account was saved successfully`,
        bcAccounts,
      })
    )
    .catch(next);
};

exports.FindBlockchainAccount = async (req, res, next) => {
  const { id } = req.params;
  BlockchainAccountDao.FindAccounts({
    userID: req.user._id,
    _id: id,
  })
    .then((bcAccounts) =>
      sendSuccess(res, {
        message: `Blockchain account was saved successfully`,
        bcAccounts,
      })
    )
    .catch(next);
};

exports.CreateBlockchainAccount = async (req, res, next) => {
  const { _id, type, transactionSignatureID } = req.user;
  const { name, description, keypair } = req.body;

  if (!transactionSignatureID)
    return sendError(res, {
      message: `Transaction signature is required to save blockchain account, try again after creating your transaction signature`,
    });

  // info validation
  await Validation.text("name", 2, 24).run(req);
  await Validation.text("description", 0, 120).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  const base64EncryptedBCAccountSecretKey = RSA.EncryptWithRawPublicKey(
    transactionSignatureID,
    keypair.secretKey
  );

  BlockchainAccountDao.CreateBlockchainAccount({
    userID: _id,
    userType: type,
    publicKey: keypair.publicKey,
    secretKey: base64EncryptedBCAccountSecretKey,
    name,
    description,
  })
    .then(() =>
      sendSuccess(res, {
        message: `Blockchain account was saved successfully`,
      })
    )
    .catch(next);
};

exports.UpdateBlockchainAccountInfo = async (req, res, next) => {
  const { id } = req.params;

  const filteredData = JSON.parse(
    JSON.stringify(req.body, ["name", "description", "isWallet", "isChannel"])
  );

  // info validation
  if (filteredData.name) await Validation.text("name", 2, 24).run(req);
  await Validation.text("description", 0, 120).run(req);

  try {
    ValidateRequest(req);
  } catch (err) {
    return next(err);
  }

  BlockchainAccountDao.UpdateAccounts(
    {
      userID: req.user._id,
      _id: id,
    },
    filteredData
  )
    .then(() =>
      sendSuccess(res, {
        message: `Blockchain account was updated successfully`,
      })
    )
    .catch(next);
};

exports.UnLockBlockchainAccount = async (req, res, next) => {
  const { id } = req.params;

  BlockchainAccountDao.UpdateAccounts(
    {
      userID: req.user._id,
      _id: id,
    },
    {
      isLocked: false,
      lockSequence: null,
      lockTransaction: null,
    }
  )
    .then(() =>
      sendSuccess(res, {
        message: `Blockchain account was unlockced successfully`,
      })
    )
    .catch(next);
};

exports.RemoveBlockchainAccount = async (req, res, next) => {
  const { id } = req.params;
  BlockchainAccountDao.DeleteAccounts({ userID: req.user._id, _id: id })
    .then(() =>
      sendSuccess(res, {
        message: `Account was removed successfully`,
      })
    )
    .catch(() =>
      sendError(res, {
        message: `Account was not removed`,
      })
    );
};

// deprecated
exports.TransferBlockchainAccount = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { destination } = req.body;
    const bcAccounts = await BlockchainAccountDao.FindAccounts({ userID: _id });
    var transferedAccounts = 0;
    if (bcAccounts && bcAccounts.length > 0) {
      for (var i = 0; i < bcAccounts.length; ++i) {
        try {
          var bcAccount = bcAccounts[i];
          //  blockchain transaction
          ++transferedAccounts;
          await BlockchainAccountDao.DeleteAccounts({ _id: bcAccount._id });
        } catch (e) {}
      }
      sendSuccess(res, {
        message: `${transferedAccounts} out of ${bcAccounts.length}) accounts were transfered successfully`,
      });
    }
    sendError(res, {
      message: "No accounts found to transfer",
    });
  } catch (e) {
    sendError(res, {
      message: "Error: Transfer failed - " + e.message,
    });
  }
};

exports.LockBlockchainAccount = async (
  userID,
  _id,
  lockSequence,
  lockTransaction
) => {
  try {
    if (!userID || !_id || !lockSequence || !lockTransaction) return false;
    await BlockchainAccountDao.UpdateAccounts(
      {
        userID,
        _id,
      },
      {
        isLocked: true,
        lockSequence,
        lockTransaction,
      }
    );
    return true;
  } catch (e) {
    return false;
  }
};

exports.UpdateTxSignatureForAllUserBlockchainAccountsFn = async (
  userID,
  tx_signature_key,
  newTransactionSignatureID
) => {
  try {
    if (!userID) return null;
    var failedAccounts = [];
    const bcAccounts = await BlockchainAccountDao.FindAccounts({ userID });
    if (bcAccounts && bcAccounts.length > 0) {
      for (var i = 0; i < bcAccounts.length; ++i) {
        var bcAccount = bcAccounts[i];
        try {
          var BCAccountSecretKey = RSA.DecryptWithRawPrivateKey(
            tx_signature_key,
            bcAccount.secretKey
          );
          var base64EncryptedBCAccountSecretKey = RSA.EncryptWithRawPublicKey(
            newTransactionSignatureID,
            BCAccountSecretKey
          );
          bcAccount.secretKey = base64EncryptedBCAccountSecretKey;
          await bcAccount.save();
        } catch (e) {
          if (bcAccount) failedAccounts.push(bcAccount.publicKey);
        }
      }
    }
    return failedAccounts;
  } catch (e) {
    return null;
  }
};

exports.ForceRemoveAllUserBlockchainAccounts = async (userID) => {
  try {
    if (userID) await BlockchainAccountDao.DeleteAccounts({ userID });
    return true;
  } catch (e) {
    return false;
  }
};