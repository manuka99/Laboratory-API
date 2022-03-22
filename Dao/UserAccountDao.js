const UserSchema = require("../Schemas/Users/User");
const GeneralUserSchema = require("../Schemas/Users/GeneralUser");
const UserModel = require("../Models/UserModel");

var AccountSchema = UserSchema;

const AllUserSecureEntries =
  "+phone +tempPhone +password +transactionSignatureID +transactionSignatureKey +transactionPassword +isMobileAuthenticationEnabled +two_factor_secret +approvalReason +approvedBy +phone_verified_at +email_verified_at +pwd_recovery_token +pwd_rtoken_exp_at +phone_verify_token +phone_vtoken_exp_at +tphone_verify_token +tphone_vtoken_exp_at +email_verify_token +email_vtoken_exp_at";

const OnlyAdminSecureEntires = ``;

const OnlyGeneralSecureEntires = `+dateOfBirth +street +province +district +nationality +address +zipCode +imagePaths`;

const AllSecureEntries = `${AllUserSecureEntries} ${OnlyAdminSecureEntires} ${OnlyGeneralSecureEntires}`;

const findUsers = async (
  query,
  isSelectSecure = false,
  SecureEntries = AllSecureEntries
) => {
  var users;
  if (isSelectSecure)
    users = await AccountSchema.find(query).select(SecureEntries);
  else users = await AccountSchema.find(query);
  return users;
};

const findUser = async (
  query,
  isSelectSecure = false,
  SecureEntries = AllSecureEntries
) => {
  var user;
  if (isSelectSecure)
    user = await AccountSchema.findOne(query).select(SecureEntries);
  else user = await AccountSchema.findOne(query);
  return user;
};

const create = async (data) => {
  var user = await AccountSchema.create(data);
  return user;
};

const update = async (_id, data) => {
  var user = await AccountSchema.findByIdAndUpdate(_id, data, {
    new: true,
  });
  return user;
};

const AccountDao = (type) => {
  if (type == UserModel.GENERAL) AccountSchema = GeneralUserSchema;
  return {
    findUsers,
    findUser,
    create,
    update,
    AllUserSecureEntries,
    OnlyAdminSecureEntires,
    OnlyGeneralSecureEntires,
    AllSecureEntries,
  };
};

module.exports = Object.freeze(AccountDao);
