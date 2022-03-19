const { sendError } = require("../../Common/util");
const { TX_PWD_SIGNATURE_KEY } = require("../../Config");
const { DecryptWithRawPrivateKey } = require("../../Util/RSA.service");
const { ErrorCodeEnum } = require("../../Models/ErrorModel");

exports.TxnPwdVerified = async (req, res, next) => {
  const { tx_pwd } = req.headers;
  var message =
    "Permission denied: You are not authorized to perform this function.";
  if (!tx_pwd) message += " Transaction Password Verification is required";
  else {
    try {
      var decrypted_tx_pwd = DecryptWithRawPrivateKey(
        TX_PWD_SIGNATURE_KEY,
        tx_pwd
      );
      var decryptedTransactionSignatureKey =
        req.user.decryptTxSignatureKey(decrypted_tx_pwd);
      req.user.transactionSignatureKey = decryptedTransactionSignatureKey;
      return next();
    } catch (error) {
      message += " Incorrect transaction password.";
    }
  }
  return sendError(
    res,
    {
      message,
      code: ErrorCodeEnum.TX_PASSWORD_VERIFICATION,
    },
    403
  );
};
