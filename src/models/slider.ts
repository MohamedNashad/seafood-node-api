import mongoose, { Schema } from "mongoose";

export type SliderType = {
  _id: string;
  groupId: string; // Changed from optional to required
  clientId: mongoose.Types.ObjectId;
  title: string;
  buttonUrl?: string;
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

const sliderSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    index: true, // Add index for better query performance
  },
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true }, // Reference to Slider model
  title: { type: String, required: true },
  buttonUrl: { type: String },
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
sliderSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Add compound index for groupId and isDelete
sliderSchema.index({ groupId: 1, isDelete: 1 });

const Slider = mongoose.model<SliderType>("Slider", sliderSchema);

export default Slider;
