const {
  Schema,
  model,
  Types: { ObjectId },
} = require("mongoose");

const TokenSchema = new Schema(
  {
    user_id: { type: ObjectId },
    user_type: {
      type: String,
      enum: ["GENERAL", "SERVICE"],
    },
    token: { type: String, select: false },
    ip_address: String,
    user_agent: String,
    deviceType: String,
    deviceInfo: String,
    osInfo: String,
    browser: String,
    version: String,
    payload: String,
    last_activity: Number,
    isValid: Boolean,
  },

  { timestamps: true }
);

const JWTToken = model("token", TokenSchema);
module.exports = JWTToken;
