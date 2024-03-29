const { AuthRoutes } = require("./Auth");
const { ExplorerRoutes } = require("./Explorer");
const { SessionRoutes } = require("./Session");
const { BlockchainAccountRoutes } = require("./BlockchainAccount");
const { TransactionRoutes } = require("./Transaction");
const { AccountRoutes } = require("./User");
const express = require("express");
const router = express.Router();

// Authentication Routes
AuthRoutes(router);

// Explorer Routes
ExplorerRoutes(router);

// Session Routes
SessionRoutes(router);

// Session Routes
BlockchainAccountRoutes(router);

// Transaction Routes
TransactionRoutes(router);

// Account Routes
AccountRoutes(router);

// Invalid Routes
// router.use("*", (req, res) => sendError(res, "Resource not found!"));

module.exports = router;
