const mongoose = require("mongoose");
const { sendError, FormatValidationError } = require("../Common/util");
const ValidationError = require("../Common/ValidationError");
const ApplicationError = require("../Common/ApplicationError");
const AccessForbiddenError = require("../Common/AccessForbiddenError");

exports.HandleError = (err, req, res, next) => {
  console.error(`Error Handler: ${err.message}`);
  if (err instanceof mongoose.Error) sendError(res, err, 422);
  else if (err instanceof ValidationError)
    sendError(res, FormatValidationError(err), 422);
  else if (err instanceof AccessForbiddenError)
    sendError(res, { message: err.message, err }, 403);
  else if (err instanceof ApplicationError)
    sendError(res, { message: err.message, err }, 400);
  else sendError(res, { message: err.message, err }, 500);
};
