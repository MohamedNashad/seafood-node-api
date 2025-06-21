import mongoose, { Schema } from "mongoose";

export type GalleryType = {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const gallerySchema = new mongoose.Schema({
  clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true }, // Reference to Role model
  title: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  isDelete: { type: Boolean, default: false }, // Default to not deleted
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }, // Default to current timestamp
  updatedAt: { type: Date, default: Date.now }, // Default to current timestamp
  deletedAt: { type: Date }, // No default, set manually when deleted
});

// Middleware for updates
gallerySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

gallerySchema.index({ slug: 1, name: 1 }, { unique: true });

const Gallery = mongoose.model<GalleryType>("Gallery", gallerySchema);

export default Gallery;
