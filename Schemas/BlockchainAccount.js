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
      enum: [UserEnum.GENERAL, UserEnum.SERVICE],
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
    description: {
      type: String,
      required: false,
    },
    accountType: {
      type: String,
      required: true,
      enum: ["wallet", "channel"],
    },
    sponsorID: {
      type: String,
      required: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockSequence: {
      type: String,
      default: null,
    },
    lockTransaction: {
      type: Types.ObjectId,
      default: null,
      ref: "transaction",
    },
  },
  { timestamps: true }
);

BlockchainAccountSchema.index({ userID: 1, publicKey: 1 }, { unique: true });
BlockchainAccountSchema.index({
  name: "text",
  description: "text",
  publicKey: "text",
});

const BlockchainAccount = model("blockchain_account", BlockchainAccountSchema);
module.exports = BlockchainAccount;
