import mongoose, { Schema } from "mongoose";

export type RoleType = {
  _id: string;
  slug: string;
  name: string;
  rank: number;
  description: string;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const roleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  rank: { type: Number, required: true, unique: true },
  description: { type: String },
  isDelete: { type: Boolean, default: false }, // Default to not deleted
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }, // Default to current timestamp
  updatedAt: { type: Date, default: Date.now }, // Default to current timestamp
  deletedAt: { type: Date }, // No default, set manually when deleted
});

// Middleware for updates
roleSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

roleSchema.index({ slug: 1, name: 1 }, { unique: true });

const Role = mongoose.model<RoleType>("Role", roleSchema);

export default Role;
