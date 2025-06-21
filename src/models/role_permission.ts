import mongoose, { Schema } from "mongoose";

export type RolePermissionType = {
  _id: string;
  roleId: string;
  permissionId: string;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId; // Reference to the User model
  updatedBy?: mongoose.Types.ObjectId; // Reference to the User model
  createdAt: Date;
  updatedAt: Date;
};

const rolePermissionSchema = new mongoose.Schema({
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true }, // Reference to Role model
  permissionId: {
    type: Schema.Types.ObjectId,
    ref: "Permission",
    required: true,
  },
  isDelete: { type: Boolean, required: true, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Reference to User model
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Reference to User model
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create a unique index to prevent duplicates
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

const RolePermission = mongoose.model<RolePermissionType>(
  "Role_Permission",
  rolePermissionSchema
);

export default RolePermission;
