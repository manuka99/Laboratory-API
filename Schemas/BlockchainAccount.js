const {
  Schema,
  model,
  Types: { ObjectId },
} = require("mongoose");

const BlockchainAccountSchema = new Schema(
  {
    userID: {
      type: ObjectId,
      required: true,
      ref: "user",
    },
    publicKey: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      select: false,
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
      type: ObjectId,
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
