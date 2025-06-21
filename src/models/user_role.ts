import mongoose, { Schema } from "mongoose";

export type UserRoleType = {
  _id: string;
  userId: string;
  roleId: string;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId; // Reference to the User model
  updatedBy?: mongoose.Types.ObjectId; // Reference to the User model
  createdAt: Date;
  updatedAt: Date;
};

const userRoleSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true }, // Reference to Role model
  isDelete: { type: Boolean, required: true, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Reference to User model
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Reference to User model
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create a unique index to prevent duplicates
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

const UserRole = mongoose.model<UserRoleType>("User_Role", userRoleSchema);

export default UserRole;
