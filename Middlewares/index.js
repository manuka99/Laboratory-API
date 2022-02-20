const { UserEnum } = require("../Models/UserModel");
const { TokenValidator } = require("./TokenValidator");
const { GuestUser } = require("./GuestUser");
const { Authenticate } = require("./Authorization/Authenticate");
const { PhoneAuthorized } = require("./Authorization/PhoneAuthorized");
const { TwoFactorAuthorized } = require("./Authorization/TwoFactorAuthorized");
const { AccountApproved } = require("./Verification/AccountApproved");
const { AccountUnlocked } = require("./Verification/AccountUnlocked");

exports.AppMiddlewares = (app) => {
  /* VALIDATE TOKEN */
  app.all("*", TokenValidator);

  /* Guest routes */
  // not logged in
  app.use("/api/guest/", GuestUser);

  /* AUTHENTICATION (without two factor, approved, unlocked) */
  app.use("/api/auth/", Authenticate());
  app.use("/api/auth/general/", Authenticate(UserEnum.GENERAL));
  app.use("/api/auth/admin/", Authenticate(UserEnum.SERVICE));

  /* AUTHORIZATION */

  // For General Accounts
  app.use(
    "/api/general/",
    Authenticate(UserEnum.GENERAL),
    AccountUnlocked,
    AccountApproved,
    PhoneAuthorized,
    TwoFactorAuthorized
  );

  // For Service Accounts
  // app.use(
  //   "/api/admin/",
  //   Authenticate(UserEnum.SERVICE),
  //   TwoFactorAuthorized,
  //   AccountApproved,
  //   AccountUnlocked,
  //   PhoneAuthorized
  // );
};
