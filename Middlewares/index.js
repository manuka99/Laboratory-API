const { UserEnum } = require("../Models/UserModel");
const { Authenticate } = require("./Authenticate");
const { GuestUser } = require("./GuestUser");
const { TokenValidator } = require("./TokenValidator");
const { TwoFactorAuthorized } = require("./TwoFactorAuthorized");
const { AccountApproved } = require("./AccountApproved");
const { AccountUnlocked } = require("./AccountUnlocked");

exports.AppMiddlewares = (app) => {
  /* VALIDATE TOKEN */
  app.all("*", TokenValidator);

  /* Guest routes */
  app.use("/api/guest/", GuestUser);

  /* AUTHENTICATION (without two factor) */
  app.use("/api/auth/", Authenticate());
  app.use("/api/auth/general/", Authenticate(UserEnum.GENERAL));
  app.use("/api/auth/admin/", Authenticate(UserEnum.SERVICE));

  /* AUTHORIZATION */

  // For General Accounts
  app.use(
    "/api/general/",
    Authenticate(UserEnum.GENERAL),
    TwoFactorAuthorized,
    AccountApproved,
    AccountUnlocked
  );

  // For Service Accounts
  app.use(
    "/api/admin/",
    Authenticate(UserEnum.SERVICE),
    TwoFactorAuthorized,
    AccountApproved,
    AccountUnlocked
  );
};
