require("dotenv").config();

var PORT = process.env.LOCAL_PORT;
var DB = process.env.LOCAL_DB;
var SMS_NUMBER = process.env.SMS_NUMBER;
var SMS_PASS = process.env.SMS_PASS;
var MAIL_USER = process.env.MAIL_USER;
var MAIL_PASSWORD = process.env.MAIL_PASSWORD;
var TX_PWD_SIGNATURE_ID = process.env.TX_PWD_SIGNATURE_ID;
var TX_PWD_SIGNATURE_KEY = process.env.TX_PWD_SIGNATURE_KEY;

// blockchain
var BLOCKCHAIN_NAME = "STELLAR";
var BLOCKCHAIN_NETWORK_TYPE = "testnet";
var BLOCKCHAIN_NETWORK_NAME = "Test SDF Network ; September 2015";
var BLOCKCHAIN_NETWORK_URI = "https://horizon-testnet.stellar.org";
var BLOCKCHAIN_NETWORK_BASE_FEE_TYPE = "stroop";
var BLOCKCHAIN_NETWORK_BASE_FEE_VALUE = 100;
var BLOCKCHAIN_NETWORK_BASE_RESERVE_TYPE = "lumen";
var BLOCKCHAIN_NETWORK_BASE_RESERVE_VALUE = 0.5;

if (process.env.NODE_ENV && process.env.NODE_ENV.trim() == "production") {
  PORT = process.env.PORT;
  DB = process.env.ATLAS_DB;
}

module.exports = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  DB,
  PORT,
  SMS_NUMBER,
  SMS_PASS,
  MAIL_USER,
  MAIL_PASSWORD,
  TX_PWD_SIGNATURE_ID,
  TX_PWD_SIGNATURE_KEY,
  BLOCKCHAIN_NAME,
  BLOCKCHAIN_NETWORK_TYPE,
  BLOCKCHAIN_NETWORK_NAME,
  BLOCKCHAIN_NETWORK_URI,
  BLOCKCHAIN_NETWORK_BASE_FEE_TYPE,
  BLOCKCHAIN_NETWORK_BASE_FEE_VALUE,
  BLOCKCHAIN_NETWORK_BASE_RESERVE_TYPE,
  BLOCKCHAIN_NETWORK_BASE_RESERVE_VALUE,
};
