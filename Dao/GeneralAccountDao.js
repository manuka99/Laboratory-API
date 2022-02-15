const GeneralAccount = require("../Schemas/Users/GeneralAccount");

exports.findUserById = async (id, getALL = false) => {
  if (getALL) {
    var user = await GeneralAccount.findById(id).select(
      "+password +transactionPassword +two_factor_secret +email_verify_token +pwd_recovery_token"
    );
    return user;
  } else {
    var user = await GeneralAccount.findById(id);
    return user;
  }
};

exports.findUsers = async (query) => {
  var users = await GeneralAccount.find(query);
  return users;
};

exports.findUser = async (query) => {
  var users = await GeneralAccount.findOne(query);
  return users;
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

exports.findUserByNICWithPassword = async (nationalID) => {
  var generalAccount = await GeneralAccount.findOne({
    nationalID,
  }).select("+password");
  return generalAccount;
};

exports.findUserByNICWith2faSecret = async (nationalID) => {
  var generalAccount = await GeneralAccount.findOne({
    nationalID,
  }).select("+two_factor_secret");
  return generalAccount;
};
