function test1() {
  const oldData = {
    type: "GENERAL",
    nationalID: "199920610568",
    _id: "sas2321323",
    user_id: "1212www",
    isMobileAuthorized: false,
    is2FAAuthorized: false,
    pwd_confirm_exp_at: "",
    phone_confirm_exp_at: "",
    twoFA_confirm_exp_at: null,
  };
  const data = {
    is2FAAuthorized: true,
    pwd_confirm_exp_at: new Date(new Date().getTime() + 60000 * 10),
  };

  const filteredData = JSON.parse(
    JSON.stringify(data, [
      "isMobileAuthorized",
      "is2FAAuthorized",
      "pwd_confirm_exp_at",
      "phone_confirm_exp_at",
      "twoFA_confirm_exp_at",
    ])
  );

  const newData = {
    ...oldData,
    ...filteredData,
  };

  console.log(newData);
}

test1();
