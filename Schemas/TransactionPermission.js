const {
  Schema,
  model,
  Types: { ObjectId },
} = require("mongoose");

const TransactionPermissionSchema = new Schema(
  {
    txnID: { type: ObjectId, ref: "transaction" },
    userID: { type: ObjectId, ref: "user" },
    isView: {
      type: Boolean,
      default: false
    },
    isSign: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    expire_at: Date,
  },
  { timestamps: true }
);

const TransactionPermission = model("transaction_permission", TransactionPermissionSchema);
module.exports = TransactionPermission;
