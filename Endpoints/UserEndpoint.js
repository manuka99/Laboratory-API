const { sendSuccess, sendError } = require("../Common/util");
const { UserEnum } = require("../Models/UserModel");
const ValidationError = require("../Common/ValidationError");
const AdminEndpoint = require("../Endpoints/AdminEndpoint");
const SupplierEndpoint = require("../Endpoints/SupplierEndpoint");
const SiteManagerEndpoint = require("../Endpoints/SiteManagerEndpoint");
const AccountantEndpoint = require("../Endpoints/AccountantEndpoint");
const UserDao = require("../Dao/UserDao");

//to validate token
exports.GetRequestUser = (req, res, next) => {
  return sendSuccess(res, { user: req.user });
};

exports.GetAllManagementUsers = async (req, res, next) => {
  try {
    const users = await UserDao.AllSiteManagementUsers();
    return sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};

exports.CreateManagementUser = async (req, res, next) => {
  try {
    const user = await UserDao.create(req.body);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

exports.UpdateManagementUser = async (req, res, next) => {
  try {
    const user = await UserDao.update(req.params.id, req.body);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

exports.DeleteManagementUser = async (req, res, next) => {
  try {
    const user = await UserDao.delete(req.params.id);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

exports.GetAllSiteManagers = async (req, res, next) => {
  try {
    const users = await UserDao.AllSiteManagers();
    return sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};

exports.Registration = (req, res, next) => {
  const { role } = req.body;
  switch (role) {
    case UserEnum.ADMIN:
      AdminEndpoint.Registration(req, res, next);
      break;
    case UserEnum.SITEMANAGER:
      SiteManagerEndpoint.Registration(req, res, next);
      break;
    case UserEnum.ACCOUNTANT:
      AccountantEndpoint.Registration(req, res, next);
      break;
    case UserEnum.MANAGER:
      ReviewerEndpoint.ReviewerRegistration(req, res, next);
      break;
    case UserEnum.SUPPLIER:
      SupplierEndpoint.Registration(req, res, next);
      break;
    default:
      throw new ValidationError("Invalid Role assigned!");
  }
};

exports.Login = async (req, res, next) => {
  const { email, password } = req.body;

  // match email
  UserDao.findUserByEmailWithPassword(email)
    .then((user) => {
      if (!user)
        return sendError(res, {
          message: "No account associated with the email provided.",
        });

      // match password
      const isMatch = user.matchPasswords(password);
      if (!isMatch)
        return sendError(res, {
          message: "Password is incorrect",
        });

      // return jwt token
      user.password = null;

      return sendSuccess(res, {
        user,
        message: "Success user login",
        token: user.getSignedJwtToken(),
      });
    })
    .catch(next);
};
