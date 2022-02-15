const cors = require("cors");
const express = require("express");
var useragent = require("express-useragent");
const { AppRoutes } = require("./Routes");
const { AppMiddlewares } = require("./Middlewares");
const { HandleError } = require("./Middlewares/HandleError");
const fileUpload = require("express-fileupload");

// init the app
const app = express();

app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(fileUpload());

/* MIDDLEWARES */
AppMiddlewares(app);

/* ROUTES */
AppRoutes(app);

/* ERRORS */
app.use(HandleError);

module.exports = app;