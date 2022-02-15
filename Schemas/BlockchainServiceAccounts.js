const { Schema, model } = require("mongoose");

const BlockchainServiceAccountsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    accountID: {
      type: String,
      required: true,
      unique: true,
    },
    secret: {
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

const BlockchainServiceAccount = model(
  "blockchain_service_account",
  BlockchainServiceAccountsSchema
);
module.exports = BlockchainServiceAccount;
