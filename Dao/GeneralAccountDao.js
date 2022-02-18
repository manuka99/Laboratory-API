const GeneralAccount = require("../Schemas/Users/GeneralAccount");

const allSecureEntries =
  "+password +transactionPassword +two_factor_secret +pwd_recovery_token +pwd_rtoken_exp_at +phone_verify_token +phone_vtoken_exp_at +tphone_verify_token +tphone_vtoken_exp_at +email_verify_token +email_vtoken_exp_at";

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
