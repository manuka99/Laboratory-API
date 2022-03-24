const {
  Schema,
  model,
  Types: { ObjectId },
} = require("mongoose");
const TransactionPermission = require("./TransactionPermission");

const TransactionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    projectID: { type: ObjectId, ref: "project" },
    raw_data: Object,
    txnHash: String,
    txnXdr: String,
    signedTxnXdr: String,
    network: String,
    expire_at: Date,
    signatures: [
      {
        accountID: { type: String },
        sign: { type: String },
        user: { type: ObjectId, ref: "user" },
        isAccepted: { type: Boolean, default: false },
      },
    ],
    owner: {
      type: ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ network: 1, txnHash: 1 }, { unique: true });
TransactionSchema.index({ network: 1, txnXdr: 1 }, { unique: true });
TransactionSchema.index({
  title: "text",
  description: "text",
  network: "text",
});
TransactionSchema.post("remove", async function (res, next) {
  await TransactionPermission.deleteMany({ txnID: this._id });
  next();
});
const Transaction = model("transaction", TransactionSchema);
module.exports = Transaction;
