const GeneralAccountExpEP = require("../../Endpoints/GeneralAccountExpEP");

exports.GeneralAccountExplorerRoutes = (app) => {
  /* Public Routes */
  app.get("/api/public/explorer/user/:nationalID", GeneralAccountExpEP.GetUserEP);
};
