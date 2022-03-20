const { sendSuccess, sendError, FilterData } = require("../Common/util");
const BlockchainAccountDao = require("../Dao/BlockchainAccountDao");
const RSA = require("../Util/RSA.service");
const { Validation } = require("../Validation");
const { ValidateRequest } = require("../Middlewares/ValidateRequest");
const { TransactionBuilder, Keypair } = require("stellar-sdk");

exports.SignTransaction = async (req, res, next) => {
  const { isOnline, accountID, xdr, network } = req.body;
  const { _id, type, transactionSignatureKey } = req.user;

  BlockchainAccountDao.FindAccounts(
    {
      userID: _id,
      userType: type,
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
          sendSuccess(res, {
            message: `Transaction was signed successfully`,
            signature: sig,
          });
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
