import mongoose, { Schema } from "mongoose";

export type DefaultPermissionTypes = {
  USER: "USER";
  ROLE: "ROLE";
  PERMISSION: "PERMISSION";
  CLIENT: "CLIENT";
  ABOUT: "ABOUT";
  SLIDER: "SLIDER";
  SERVICE: "SERVICE";
  EMPLOYEE: "EMPLOYEE";
  CONATACT: "CONATACT";
  GALLERY: "GALLERY";
  PRODUCT: "PRODUCT";
  MEMBER: "MEMBER";
  SETTING: "SETTING";
  ORDER: "ORDER";
};

export type PermissionType = {
  _id: string;
  code: string;
  name: string;
  type: DefaultPermissionTypes;
  description: string;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const permissionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  description: { type: String, required: false },
  isDelete: { type: Boolean, default: false }, // Default to not deleted
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }, // Default to current timestamp
  updatedAt: { type: Date, default: Date.now }, // Default to current timestamp
  deletedAt: { type: Date }, // No default, set manually when deleted
});

// Middleware for updates
permissionSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

permissionSchema.index({ code: 1, name: 1 }, { unique: true });

const Permission = mongoose.model<PermissionType>(
  "Permission",
  permissionSchema
);

export default Permission;
