const { Schema, model, Types } = require("mongoose");

const TransactionSchema = new Schema(
  {
    title: String,
    description: String,
    txnHash: String,
    txnXdr: String,
    txnHash: String,
    txnHash: String,
    code: {
      type: String,
      required: true,
      unique: true,
    },
    accountID: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Transaction = model("transaction", TransactionSchema);
module.exports = Transaction;
