const { AccountAuthRoutes } = require("./Account");
const {TransactionAuthRoutes} = require("./Transaction");
const AuthEndpoint = require("../../../Endpoints/AuthEndpoint");
const RoutesEnum = require("../../../Models/RouteModel");

exports.AuthRoutes = (router) => {
  router.get(`${RoutesEnum.PUBLIC}/auth-user`, AuthEndpoint.GetRequestUser);
  router.get(`${RoutesEnum.AUTH}/logout`, AuthEndpoint.GetRequestUser);
  AccountAuthRoutes(router);
  TransactionAuthRoutes(router);
};
