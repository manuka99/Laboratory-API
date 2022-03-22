const { sendSuccess } = require("../Common/util");
const UserModel = require("../Models/UserModel");
const GeneralAccountDao = require("../Dao/UserAccountDao")(UserModel.GENERAL);
const bcrypt = require("bcrypt");

exports.Registration = async (req, res, next) => {
  const {
    firstName,
    middleName,
    lastName,
    gender,
    nationalID,
    dateOfBirth,
    phone,
    email,
    street,
    province,
    district,
    country,
    nationality,
    zipCode,
    address,
    raw_password,
    imagePaths,
  } = req.body;

  const encrypted_pwd = bcrypt.hashSync(raw_password, 12);

  GeneralAccountDao.create({
    firstName,
    middleName,
    lastName,
    gender,
    nationalID,
    dateOfBirth,
    phone,
    email,
    street,
    province,
    district,
    country,
    nationality,
    zipCode,
    address,
    password: encrypted_pwd,
    imagePaths,
  })
    .then(() =>
      sendSuccess(res, {
        message: "Account was created successfully.",
      })
    )
    .catch(next);
};

exports.FindUsers = (req, res, next) => {
  const query = req.query;
  GeneralAccountDao.findUsers(query)
    .then((users) => {
      sendSuccess(res, {
        users,
      });
    })
    .catch(next);
};
