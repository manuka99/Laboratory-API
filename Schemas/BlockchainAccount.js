const { Schema, model, Types } = require("mongoose");
const { UserEnum } = require("../Models/UserModel");

const BlockchainAccountSchema = new Schema(
  {
    userID: {
      type: Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: [UserEnum.GENERAL, UserEnum.SERVICE]
    },
    publicKey: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    isWallet: Boolean,
    isChannel: Boolean,
    isLocked: Boolean,
    lockSequence: String,
    lockTransaction: {
      type: Types.ObjectId,
      ref: "transaction",
    },
  },
  { timestamps: true }
);

BlockchainAccountSchema.index({ 'userID': 1, 'publicKey': 1 }, { unique: true });

const BlockchainAccount = model(
  "blockchain_sub_account",
  BlockchainAccountSchema
);
module.exports = BlockchainAccount;
