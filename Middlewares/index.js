const UserModel = require("../Models/UserModel");
const { TokenValidator } = require("./TokenValidator");
const { GuestUser } = require("./GuestUser");
const { Authenticate } = require("./Authorization/Authenticate");
const { PhoneAuthorized } = require("./Authorization/PhoneAuthorized");
const { TwoFactorAuthorized } = require("./Authorization/TwoFactorAuthorized");
const { AccountApproved } = require("./Verification/AccountApproved");
const { AccountUnlocked } = require("./Verification/AccountUnlocked");
const RoutesEnum = require("../Models/RouteModel");

exports.AppMiddlewares = (app) => {
  /* VALIDATE TOKEN */
  app.all("*", TokenValidator);

  /* Guest routes */
  // not logged in
  app.use(`${RoutesEnum.API}${RoutesEnum.GUEST}/`, GuestUser);

  /* AUTHENTICATION (without two factor, approved, unlocked) */
  app.use(`${RoutesEnum.API}${RoutesEnum.AUTH}/`, Authenticate());
  app.use(
    `${RoutesEnum.API}${RoutesEnum.AUTH_GENERAL}/`,
    Authenticate(UserModel.GENERAL)
  );
  app.use(
    `${RoutesEnum.API}${RoutesEnum.AUTH_ADMIN}/`,
    Authenticate(UserModel.SERVICE)
  );

  /* AUTHORIZATION */

  // For General Accounts
  app.use(
    `${RoutesEnum.API}${RoutesEnum.GENERAL}/`,
    Authenticate(UserModel.GENERAL),
    AccountUnlocked,
    AccountApproved,
    PhoneAuthorized,
    TwoFactorAuthorized
  );

  // For Service Accounts
  // app.use(
  //   `${RoutesEnum.API}${RoutesEnum.ADMIN}/`,
  //   Authenticate(UserModel.SERVICE),
  //   TwoFactorAuthorized,
  //   AccountApproved,
  //   AccountUnlocked,
  //   PhoneAuthorized
  // );

  // Users
  app.use(
    `${RoutesEnum.API}${RoutesEnum.USER}/`,
    Authenticate(),
    AccountUnlocked,
    AccountApproved,
    PhoneAuthorized,
    TwoFactorAuthorized
  );
};
