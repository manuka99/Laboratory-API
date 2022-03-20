const BlockchainAccount = require("../Schemas/BlockchainAccount");

exports.CreateAccounts = async (data) => {
  var account = await BlockchainAccount.create(data);
  return account;
};

exports.UpdateAccounts = async (query, data) => {
  const accounts = await BlockchainAccount.updateMany(query, data);
  return accounts;
};

exports.FindAccounts = async (
  query,
  sort = { _id: "asc" },
  limit = 10,
  page = 0,
  isSecret = false
) => {
  var accounts = null;
  if (isSecret) {
    accounts = await BlockchainAccount.find(query)
      .sort(sort)
      .limit(limit)
      .skip(limit * page)
      .select("+secretKey");
  } else {
    accounts = await BlockchainAccount.find(query)
      .sort(sort)
      .limit(limit)
      .skip(limit * page);
  }
  return accounts;
};

exports.DeleteAccounts = async (query) => {
  const accounts = await BlockchainAccount.deleteMany(query);
  return accounts;
};
