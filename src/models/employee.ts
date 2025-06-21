import mongoose, { Schema } from "mongoose";

export type EmployeeType = {
  _id: string;
  groupId: string; // Changed from optional to required
  clientId: mongoose.Types.ObjectId;
  title: string;
  linkUrl?: string;
  image?: string;
  description: string;
  status?: boolean;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const employeeSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    index: true, // Add index for better query performance
  },
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true }, // Reference to Employee model
  title: { type: String, required: true },
  linkUrl: { type: String },
  image: { type: String },
  description: { type: String },
  status: { type: Boolean, default: false }, // Default to not deleted
  isDelete: { type: Boolean, default: false }, // Default to not deleted
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }, // Default to current timestamp
  updatedAt: { type: Date, default: Date.now }, // Default to current timestamp
  deletedAt: { type: Date }, // No default, set manually when deleted
});

// Middleware for updates
employeeSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

employeeSchema.index({ groupId: 1, isDelete: 1 });

const Employee = mongoose.model<EmployeeType>("Employee", employeeSchema);

export default Employee;
