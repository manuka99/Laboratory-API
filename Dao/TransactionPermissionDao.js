const TransactionPermission = require("../Schemas/TransactionPermission");

const findAll = async (query, sort = { _id: "asc" }, limit = 10, page = 0) => {
  var entries = await TransactionPermission.find(query)
    .sort(sort)
    .limit(limit)
    .skip(limit * page).populate("txnID");
  return entries;
};

const findOne = async (query) => {
  var entry = await TransactionPermission.findOne(query);
  return entry;
};

const create = async (data) => {
  var entry = await TransactionPermission.create(data);
  return entry;
};

const update = async (_id, data) => {
  var entry = await TransactionPermission.findByIdAndUpdate(_id, data, {
    new: true,
  });
  return entry;
};

const TransactionPermissionDao = {
  findAll,
  findOne,
  create,
  update,
};

module.exports = Object.freeze(TransactionPermissionDao);
