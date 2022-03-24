const Transaction = require("../Schemas/Transaction");

const findAll = async (query, sort = { _id: "asc" }, limit = 10, page = 0) => {
  var entries = await Transaction.find(query)
    .sort(sort)
    .limit(limit)
    .skip(limit * page).populate("owner signatures.user");
  return entries;
};

const findOne = async (query) => {
  var entry = await Transaction.findOne(query);
  return entry;
};

const create = async (data) => {
  var entry = await Transaction.create(data);
  return entry;
};

const update = async (filter, data) => {
  var entry = await Transaction.findOneAndUpdate(filter, data, {
    new: true,
    useFindAndModify: false,
  });
  return entry;
};

const TransactionDao = {
  findAll,
  findOne,
  create,
  update,
};

module.exports = Object.freeze(TransactionDao);
