import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  url: string; // Cloudinary URL
  publicId: string; // Cloudinary public ID
  resourceType: string; // e.g., "image", "video", "raw"
  fileName: string; // Original file name
  mimeType: string; // File MIME type (e.g., "image/jpeg", "application/pdf")
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: true }
);

const File = mongoose.model<IFile>("File", FileSchema);

export default File;
