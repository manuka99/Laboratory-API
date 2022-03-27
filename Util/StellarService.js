const StellarSdk = require("stellar-sdk");
const {
  BLOCKCHAIN_NETWORK_URI,
  BLOCKCHAIN_NETWORK_NAME,
  BLOCKCHAIN_NETWORK_BASE_RESERVE_VALUE,
  BLOCKCHAIN_NETWORK_BASE_FEE_VALUE,
} = require("../Config");
const server = new StellarSdk.Server(BLOCKCHAIN_NETWORK_URI);

exports.SubmitTransactionsAPI = async (xdr) => {
  return new Promise((resolve, reject) => {
    const server = new StellarSdk.Server(BLOCKCHAIN_NETWORK_URI);
    const transaction = new StellarSdk.Transaction(
      xdr,
      BLOCKCHAIN_NETWORK_NAME
    );
    server
      .submitTransaction(transaction)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};
