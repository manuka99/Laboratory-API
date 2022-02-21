var nodemailer = require("nodemailer");
var { MAIL_USER, MAIL_PASSWORD } = require("../config");
var fs = require("fs");

// send a mail using gmail
exports.sendMail = ({ to, subject, html, text }) => {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASSWORD,
      },
    });

    transporter.sendMail({ to, subject, html, text }, function (error, info) {
      if (error) {
        console.log(error.message);
        reject({ status: "fail" });
      } else {
        console.log("Email sent: " + info.response);
        resolve({ status: "success" });
      }
    });
  });
};

// read a .html file and get its data
exports.readHTMLFile = async (path) => {
  try {
    var data = fs.readFileSync(path, { encoding: "utf-8" });
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
