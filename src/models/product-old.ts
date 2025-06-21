import mongoose, { Schema } from "mongoose";

export type ProductType = {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  title: string;
  types: string[];
  quantity: number;
  unit: string; // kg / g/ l / (pieces = pc)
  costPrice: number;
  price: number;
  description: string;
  images: string[];
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const productSchema = new mongoose.Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true },
    // types: [{ type: String }],
    types: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true, // Optional: normalize case
        },
      ],
      set: function (types: any) {
        // Handle all possible input formats:
        // 1. Undefined/null -> empty array
        if (!types) return [];

        // 2. String -> split into array
        if (typeof types === "string") {
          return [
            ...new Set(
              types
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            ),
          ];
        }

        // 3. Array -> ensure proper format
        if (Array.isArray(types)) {
          return [
            ...new Set(
              types
                .map((t) => (typeof t === "string" ? t.trim() : String(t)))
                .filter(Boolean)
            ),
          ];
        }

        // 4. Any other case -> empty array
        return [];
      },
      get: function (types: string[]) {
        // Ensure we always return an array, even if stored as string
        return Array.isArray(types) ? types : [];
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: { type: String },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: { type: String },
    images: [{ type: String }],
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  {
    // Enable automatic createdAt and updatedAt timestamps
    timestamps: true,
    // Include virtuals when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for profit calculation
productSchema.virtual("profit").get(function () {
  return this.price - this.costPrice;
});

// Middleware for updates
productSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Indexes for better query performance
productSchema.index({ title: 1, clientId: 1 }, { unique: true });
productSchema.index({ type: 1 });
productSchema.index({ isDelete: 1 });

const Product = mongoose.model<ProductType>("Product", productSchema);

export default Product;
