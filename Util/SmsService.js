const { default: axios } = require("axios");
const { SMS_NUMBER, SMS_PASS } = require("../config");

// send sms using twilio
exports.sendSms = ({ to, body }) => {
  return new Promise((resolve, reject) => {
    var smsLink = `https://www.textit.biz/sendmsg/?id=${SMS_NUMBER}&pw=${SMS_PASS}s&to=${to}&text=${body}`;
    axios
      .get(smsLink)
      .then((smsRes) => {
        if (smsRes.data && smsRes.data.split(",") > 2)
          resolve({ status: "success" });
        else reject({ status: "fail" });
      })
      .catch(() => reject({ status: "fail" }));
  });
};
