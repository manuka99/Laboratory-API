const { UserEnum } = require("../Models/UserModel");
const User = require("../Schemas/Users/User");
const SiteOfficer = require("../Schemas/SiteOfficer");
const SiteOrder = require("../Schemas/SiteOrder/SiteOrder");
const SupplierOrder = require("../Schemas/SupplierOrder/SupplierOrder");

exports.AllSiteManagers = async () => {
  var users = await User.find({ role: UserEnum.SITEMANAGER }); //change to SITEMANAGER
  return users;
};

exports.AllSiteManagementUsers = async () => {
  var users = await User.find({
    role: {
      $in: [
        UserEnum.ADMIN,
        UserEnum.ACCOUNTANT,
        UserEnum.MANAGER,
        UserEnum.SITEMANAGER,
      ],
    },
  });
  return users;
};

exports.findUserById = async (id) => {
  var user = await User.findById(id);
  return user;
};

exports.create = async (data) => {
  var user = await User.create(data);
  return user;
};

exports.update = async (_id, data) => {
  var user = await User.updateOne({ _id }, data);
  return user;
};

exports.delete = async (_id) => {
  // validate
  // site incharge officer
  const siteOfficerCount = await SiteOfficer.count({ officer: _id });
  if (siteOfficerCount > 0)
    throw new Error(
      "Cannot delete user as this user is an officer at site/sites"
    );
  // user approval
  const userApprovalCount = await User.count({ approvedBy: _id });
  if (userApprovalCount > 0)
    throw new Error("Cannot delete user as this user has approved other users");
  // site order user
  const siteOrderCount = await SiteOrder.count({ user: _id });
  if (siteOrderCount > 0)
    throw new Error("Cannot delete user as this user has placed site orders");
  // supplier order user
  const supplierOrderCount = await SupplierOrder.count({ user: _id });
  if (supplierOrderCount > 0)
    throw new Error(
      "Cannot delete user as this user has placed supplier orders"
    );

  var user = await User.deleteOne({ _id });
  return user;
};

exports.findUserByEmailWithPassword = async (email) => {
  var user = await User.findOne({ email }).select("+password");
  return user;
};
