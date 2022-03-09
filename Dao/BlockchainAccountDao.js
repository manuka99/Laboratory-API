const BlockchainAccount = require("../Schemas/BlockchainAccount");

exports.CreateAccounts = async (data) => {
  var account = await BlockchainAccount.create(data);
  return account;
};

exports.UpdateAccounts = async (query, data) => {
  const accounts = await BlockchainAccount.updateMany(query, data);
  return accounts;
};

exports.FindAccounts = async (query) => {
  const accounts = await BlockchainAccount.find(query);
  return accounts;
};

exports.DeleteAccounts = async (query) => {
  const accounts = await BlockchainAccount.deleteMany(query);
  return accounts;
};
