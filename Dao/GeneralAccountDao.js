const GeneralAccount = require("../Schemas/Users/GeneralAccount");

const allSecureEntries =
  "+tempPhone +password +transactionPassword +two_factor_secret +email_verify_token +pwd_recovery_token +tphone_verify_token";

exports.findUsers = async (query, getALL = false) => {
  var users;
  if (getALL) users = await GeneralAccount.find(query).select(allSecureEntries);
  else users = await GeneralAccount.find(query);
  return users;
};

exports.findUser = async (query, getALL = false) => {
  var user;
  if (getALL)
    user = await GeneralAccount.findOne(query).select(allSecureEntries);
  else user = await GeneralAccount.findOne(query);
  return user;
};

exports.create = async (data) => {
  var user = await GeneralAccount.create(data);
  return user;
};

exports.update = async (_id, data) => {
  var user = await GeneralAccount.findByIdAndUpdate(_id, data, {
    new: true,
  });
  return user;
};
