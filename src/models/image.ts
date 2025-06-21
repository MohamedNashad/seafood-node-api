import mongoose, { Schema, Document } from "mongoose";

export interface IImage extends Document {
  url: string;
}

const ImageSchema: Schema = new Schema({
  url: { type: String, required: true },
});

const ImageModel = mongoose.model<IImage>("Image", ImageSchema);

export default ImageModel;