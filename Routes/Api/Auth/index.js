const { GeneralAccountAuthRoutes } = require("./GeneralAccount/Account");
const {
  GeneralTransactionAuthRoutes,
} = require("./GeneralAccount/Transaction");
const AuthEndpoint = require("../../../Endpoints/AuthEndpoint");
const RoutesEnum = require("../../../Models/RouteModel");

exports.AuthRoutes = (router) => {
  router.get(`${RoutesEnum.PUBLIC}/auth-user`, AuthEndpoint.GetRequestUser);
  router.get(`${RoutesEnum.AUTH}/logout`, AuthEndpoint.GetRequestUser);
  GeneralAccountAuthRoutes(router);
  GeneralTransactionAuthRoutes(router);
};
