const GeneralAccountEndpoint = require("../../../Endpoints/GeneralAccountEndpoint");
const RoutesEnum = require("../../../Models/RouteModel");

exports.GeneralAccountRoutes = (router) => {
  /* Public Routes */
  router.get(
    `${RoutesEnum.PUBLIC_GENERAL}/user`,
    GeneralAccountEndpoint.FindUsers
  );

  /* Admin */
  router.post(
    `${RoutesEnum.ADMIN_GENERAL}/registration`,
    GeneralAccountEndpoint.Registration
  );
};
