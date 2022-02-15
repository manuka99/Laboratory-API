const Consola = require("consola");

const sendSuccess = (res, data) => {
  res.status(200).json({ success: true, data });
};

const sendError = (res, data, errorCode = 400) => {
  res.status(errorCode).json({ success: false, data });
};

// format validations based on params and message
const FormatValidationError = (err) => {
  try {
    if (!err) return err;
    else {
      const { message, data } = err;
      var params = {};
      if (data && Array.isArray(data) && data.length > 0) {
        for (let index = 0; index < data.length; index++) {
          const error = data[index];
          if (error.param in params) params[error.param].push(error.msg);
          else params[error.param] = new Array(error.msg);
        }
        return { message, params };
      }
      return { message };
    }
  } catch (error) {
    Consola.error("FormatValidationError: ", err);
    return err;
  }
};

module.exports = {
  sendSuccess,
  sendError,
  FormatValidationError,
};
