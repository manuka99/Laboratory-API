const { sendSuccess } = require("../Common/util");
const GeneralAccountDao = require("../Dao/GeneralAccountDao");

exports.GetUserEP = (req, res, next) => {
  const { nationalID } = req.params;
  GeneralAccountDao.findUser({
    nationalID,
  })
    .then((resUser) => {
      const user = resUser && {
        firstName: resUser.firstName,
        lastName: resUser.lastName,
        nationalID: resUser.nationalID,
        imagePaths: resUser.imagePaths,
      };
      sendSuccess(res, {
        user,
      });
    })
    .catch(next);
};
