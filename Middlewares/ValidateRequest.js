const { validationResult } = require("express-validator");
const ValidationError = require("../Common/ValidationError");
const _ = require("lodash");

exports.ValidateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(
      "There are some items that require your attention",
      errors.array()
    );
  }
  if (next) next();
};
