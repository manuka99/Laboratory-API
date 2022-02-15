const { Schema, model, Types } = require("mongoose");

const BlockchainSubAccountsSchema = new Schema(
  {
    accountID: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      required: true,
      ref: "general_user",
    },
  },
  { timestamps: true }
);

PermissionSchema.index({ accountID: 1, secret: 1, user: 1 }, { unique: true });

const BlockchainSubAccount = model(
  "blockchain_sub_account",
  BlockchainSubAccountsSchema
);
module.exports = BlockchainSubAccount;
