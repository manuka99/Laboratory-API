const { UserEnum } = require("../Models/UserModel");
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
    Authenticate(UserEnum.GENERAL)
  );
  app.use(
    `${RoutesEnum.API}${RoutesEnum.AUTH_ADMIN}/`,
    Authenticate(UserEnum.SERVICE)
  );

  /* AUTHORIZATION */

  // For General Accounts
  app.use(
    `${RoutesEnum.API}${RoutesEnum.GENERAL}/`,
    Authenticate(UserEnum.GENERAL),
    AccountUnlocked,
    AccountApproved,
    PhoneAuthorized,
    TwoFactorAuthorized
  );

  // For Service Accounts
  // app.use(
  //   `${RoutesEnum.API}${RoutesEnum.ADMIN}/`,
  //   Authenticate(UserEnum.SERVICE),
  //   TwoFactorAuthorized,
  //   AccountApproved,
  //   AccountUnlocked,
  //   PhoneAuthorized
  // );
};
