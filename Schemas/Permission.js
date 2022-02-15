const { Schema, model, Types } = require("mongoose");

const PermissionSchema = new Schema(
  {
    serviceAccount: {
      type: Types.ObjectId,
      ref: "service_user",
    },
    entity: {
      type: Types.ObjectId,
      ref: "entity",
    },
    permissions: {
      type: Array,
    },
  },
  { timestamps: true }
);

PermissionSchema.index({ 'serviceAccount': 1, 'entity': 1 }, { unique: true });

const Permission = model("permission", PermissionSchema);
module.exports = Permission;
