import mongoose, { Schema } from "mongoose";

export type ProductType = {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  description: string;
  images: string[];
  types: {
    type: string;
    price: number;
    _id?: mongoose.Types.ObjectId;
  }[];
  unit: string;
  minOrder?: Number;
  quantity: Number;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  __v?: number;
};

const productSchema = new mongoose.Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    types: [
      {
        type: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    unit: { type: String, required: true },
    minOrder: { type: Number },
    quantity: { type: Number, required: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 1, clientId: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ isDelete: 1 });

const Product = mongoose.model<ProductType>("Product", productSchema);

export default Product;
