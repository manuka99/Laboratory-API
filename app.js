const cors = require("cors");
const express = require("express");
var useragent = require("express-useragent");
const ApiRoutes = require("./Routes/Api");
const { AppMiddlewares } = require("./Middlewares");
const { HandleError } = require("./Middlewares/HandleError");
const fileUpload = require("express-fileupload");
const RoutesEnum = require("./Models/RouteModel");

// init the app
const app = express();

app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(fileUpload());

/* MIDDLEWARES */
AppMiddlewares(app);

/* ROUTES */
app.use(RoutesEnum.API, ApiRoutes);

/* ERRORS */
app.use(HandleError);

module.exports = app;
