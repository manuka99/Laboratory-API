const {
  sendSuccess,
  sendError,
  FilterData,
  FutureDate,
} = require("../Common/util");
const BlockchainAccountDao = require("../Dao/BlockchainAccountDao");
const TransactionDao = require("../Dao/TransactionDao");
const TransactionPermissionDao = require("../Dao/TransactionPermissionDao");
const { Validation } = require("../Validation");
const { ValidateRequest } = require("../Middlewares/ValidateRequest");
const { TransactionBuilder, Keypair } = require("stellar-sdk");
const RSA = require("../Util/RSA.service");

const TempTxnExpireAt = 60 * 24 * 30; // 30 days

exports.GetTxnUserPermission = async (txnQuery, userID) => {
  const data = {
    isView: false,
    isSign: false,
    isEdit: false,
    error: null,
  };
  try {
    const txn = await TransactionDao.findOne(txnQuery);
    if (!txn) throw new Error("No transaction on cloud");

    if (txn.owner.toString() == userID) {
      data.isView = true;
      data.isSign = true;
      data.isEdit = true;
      return data;
    }

    try {
      const pms = await TransactionPermissionDao.findAll({
        txnID: txn._id,
        userID,
      });

      if (pms.findIndex((pm) => pm.isEdit) != -1) {
        data.isView = true;
        data.isSign = true;
        data.isEdit = true;
        return data;
      } else if (pms.findIndex((pm) => pm.isSign) != -1) {
        data.isView = true;
        data.isSign = true;
        data.isEdit = false;
        return data;
      } else if (pms.findIndex((pm) => pm.isView) != -1) {
        data.isView = true;
        data.isSign = false;
        data.isEdit = false;
        return data;
      } else {
        data.error = "You do not have permisions";
        return data;
      }
    } catch (e) {
      data.error = "You do not have permisions";
      return data;
    }
  } catch (e) {
    console.log(e)
    data.error = "Transaction is not available on cloud.";
    return data;
  }
};

// metaverse
exports.SignTransaction = async (req, res, next) => {
  const { isOnline, accountID, xdr, network } = req.body;
  const { _id, transactionSignatureKey } = req.user;

  if (isOnline) {
    // check permissions
    const txnPem = await this.GetTxnUserPermission(
      { txnXdr: xdr, network },
      _id
    );
    if (!txnPem || txnPem.error || !txnPem.isSign)
      return sendError(res, {
        message:
          "You do not have required permisions to sign this transaction online",
      });
  }

  BlockchainAccountDao.FindAccounts(
    {
      userID: _id,
      publicKey: accountID,
    },
    undefined,
    undefined,
    undefined,
    true
  )
    .then((bcAccounts) => {
      if (!bcAccounts || bcAccounts.length < 1)
        return sendError(res, {
          message:
            "The requested blockchain account is not registered under your account list",
          bcAccounts,
        });
      try {
        const bcAccount = bcAccounts[0];
        let decryptedPrivateKey = RSA.DecryptWithRawPrivateKey(
          transactionSignatureKey,
          bcAccount.secretKey
        );
        const tx = TransactionBuilder.fromXDR(xdr, network);
        var keypair = Keypair.fromSecret(decryptedPrivateKey);
        var sig = tx.getKeypairSignature(keypair);
        if (isOnline) {
          // save sig and accountId
          const eSignatures = onlineTxnObj.signatures;
          const prevSignIndex = eSignatures.findIndex(
            (eSignature) =>
              eSignature.accountID == accountID && eSignature.sign == sig
          );
          if (prevSignIndex != -1)
            return sendError(res, {
              message: "Transaction is already signed by the requested signer",
            });
          else {
            TransactionDao.update(
              { txnXdr: xdr, network },
              {
                $push: {
                  signatures: {
                    accountID,
                    sign: sig,
                    user: _id,
                  },
                },
              }
            )
              .then(() =>
                sendSuccess(res, {
                  message: `Transaction was signed successfully`,
                  signature: sig,
                })
              )
              .catch((err) =>
                sendError(res, {
                  message:
                    "An error occured while signing, please try again latter. More - " +
                    err.message,
                })
              );
          }
        } else {
          var index = tx.signatures.findIndex((signature) => {
            let sign = signature.signature().toString("base64");
            return sign == sig;
          });
          if (index != -1)
            return sendError(res, {
              message: "Transaction is already signed by the requested signer",
            });
          tx.addSignature(accountID, sig);
          var signedXdr = tx.toXDR();
          sendSuccess(res, {
            message: `Transaction was signed successfully`,
            signature: signedXdr,
          });
        }
      } catch (e) {
        sendError(res, {
          message:
            "An error occured while signing, please try again latter. More - " +
            e.message,
        });
      }
    })
    .catch((e) =>
      sendError(res, {
        message:
          "The requested blockchain account is not registered under your account list" +
          e.message,
      })
    );
};

exports.CreateTempTxn = async (req, res, next) => {
  const { title, description, txnXdr, network } = req.body;
  const { _id } = req.user;
  try {
    const tx = TransactionBuilder.fromXDR(txnXdr, network);
    console.log(tx.operations);
    const txnHash = tx.hash().toString("hex");
    const expire_at = FutureDate(TempTxnExpireAt);
    TransactionDao.create({
      title,
      description,
      txnHash,
      txnXdr,
      network,
      expire_at,
      owner: _id,
    })
      .then((txn) =>
        sendSuccess(res, {
          message: "Transaction was saved to cloud successfully.",
          txn,
        })
      )
      .catch((error) =>
        sendError(res, {
          message: "Cannot save transaction on cloud. Info: " + error.message,
        })
      );
  } catch (e) {
    sendError(res, {
      message: "Invalid transaction xdr: " + e.message,
    });
  }
};

// add any sign (dirrect secret key)
// only cloud txns
exports.AddSign = async (req, res, next) => {
  const { accountID, txnHash, network, sign } = req.body;
  const { _id } = req.user;
  try {
    // check permissions
    const txnPem = await this.GetTxnUserPermission({ txnHash, network }, _id);
    if (!txnPem || txnPem.error || !txnPem.isSign)
      return sendError(res, {
        message:
          "You do not have required permisions to sign this transaction online",
      });
    else {
      // save sig and accountId
      const eSignatures = onlineTxnObj.signatures;
      const prevSignIndex = eSignatures.findIndex(
        (eSignature) =>
          eSignature.accountID == accountID && eSignature.sign == sign
      );
      if (prevSignIndex != -1)
        return sendError(res, {
          message: "Transaction is already signed by the requested signer",
        });
      else {
        TransactionDao.update(
          { txnHash, network },
          {
            $push: {
              signatures: {
                accountID,
                sign,
                user: _id,
              },
            },
          }
        )
          .then(() =>
            sendSuccess(res, {
              message: `Signature was added to the transaction successfully`,
            })
          )
          .catch((err) =>
            sendError(res, {
              message:
                "An error occured while signing, please try again latter. More - " +
                err.message,
            })
          );
      }
    }
  } catch (e) {
    return sendError(res, {
      message: "Transaction is not available on cloud.",
    });
  }
};

// remove any sign (dirrect secret key)
// only cloud txns
exports.RemoveSign = async (req, res, next) => {
  const { accountID, txnHash, network, sign } = req.body;
  const { _id } = req.user;
  // if online confirm if the cdr is there and permission is present
  try {
    const onlineTxnObj = await TransactionDao.findOne({ txnHash, network });
    if (!onlineTxnObj) throw new Error("No transaction found on cloud");
    // if signature present
    const eSignatures = onlineTxnObj.signatures;
    const prevSign = eSignatures.find(
      (eSignature) =>
        eSignature.accountID == accountID && eSignature.sign == sign
    );
    if (!prevSign)
      return sendError(res, {
        message: "Signature does not exist in the transaction",
      });

    // permissions
    if (onlineTxnObj.owner != _id && prevSign.user != _id)
      return sendError(res, {
        message:
          "You does not have required permisions to remove this signature from the transaction",
      });

    // remove signature
    TransactionDao.update(onlineTxnObj._id, {
      $pullAll: {
        signatures: {
          accountID,
          sign,
          user: _id,
        },
      },
    })
      .then(() =>
        sendSuccess(res, {
          message: `Signature was removed from the transaction successfully`,
        })
      )
      .catch((err) =>
        sendError(res, {
          message:
            "An error occured while removing signature, please try again latter. More - " +
            err.message,
        })
      );
  } catch (e) {
    return sendError(res, {
      message: "Transaction is not available on cloud.",
    });
  }
};

exports.FindCreatedTransactions = async (req, res, next) => {
  const { _id } = req.user;
  const filteredQuery = FilterData(req.query, [
    "_id",
    "projectID",
    "txnHash",
    "txnXdr",
    "network",
    "expire_at",
  ]);
  filteredQuery.owner = _id;
  if (req.query.search) filteredQuery.$text = { $search: req.query.search };

  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 0;

  TransactionDao.findAll(filteredQuery, req.query.sort, limit, page)
    .then((txns) =>
      sendSuccess(res, {
        // message: `Created transactions were retrieved successfully`,
        txns,
      })
    )
    .catch(next);
};

exports.FindTransactions = async (req, res, next) => {
  const { _id } = req.user;
  const filteredQuery = FilterData(req.query, [
    "_id",
    "projectID",
    "txnHash",
    "txnXdr",
    "network",
    "expire_at",
    "owner",
  ]);
  if (req.query.search) filteredQuery.$text = { $search: req.query.search };

  const limit = 10;
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 0;

  TransactionDao.findAll(filteredQuery, req.query.sort, limit, page)
    .then(async (txns) => {
      const newTxns = [];
      for (let i = 0; i < txns.length; ++i) {
        let txn = txns[i];
        let { txnHash, network } = txn;
        const txnPem = await this.GetTxnUserPermission(
          { txnHash, network },
          _id
        );
        if (txnPem && !txnPem.error && txnPem.isView) newTxns.push(txn);
      }
      sendSuccess(res, {
        // message: `Transactions were retrieved successfully`,
        txns: newTxns,
      });
    })
    .catch(next);
};

exports.FindSharedTransactions = async (req, res, next) => {
  const { _id } = req.user;

  const pemQuery = {
    userID: _id,
    $or: [{ isView: true }, { isSign: true }, { isEdit: true }],
  };

  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 0;

  TransactionPermissionDao.findAll(pemQuery, req.query.sort, limit, page)
    .then((txns) =>
      sendSuccess(res, {
        // message: `Shared transactions were retrieved successfully`,
        txns,
      })
    )
    .catch(next);
};
