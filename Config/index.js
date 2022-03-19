require("dotenv").config();

var PORT = process.env.LOCAL_PORT;
var DB = process.env.LOCAL_DB;
var SMS_NUMBER = process.env.SMS_NUMBER;
var SMS_PASS = process.env.SMS_PASS;
var MAIL_USER = process.env.MAIL_USER;
var MAIL_PASSWORD = process.env.MAIL_PASSWORD;
var TX_PWD_SIGNATURE_ID = process.env.TX_PWD_SIGNATURE_ID;
var TX_PWD_SIGNATURE_KEY = process.env.TX_PWD_SIGNATURE_KEY;

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
  TX_PWD_SIGNATURE_KEY
};
