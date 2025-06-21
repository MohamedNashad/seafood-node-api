import mongoose, { Schema } from "mongoose";

export type CartItemType = {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  selectedTypes?: string[];
  price: number;
  addedAt: Date;
};

export type CartType = {
  _id: string;
  userId?: mongoose.Types.ObjectId; // Optional (for logged-in users)
  sessionId?: string; // For guest users
  clientId: mongoose.Types.ObjectId;
  items: CartItemType[];
  createdAt: Date;
  updatedAt: Date;
};

const cartItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  selectedTypes: [
    {
      type: String,
      trim: true,
      lowercase: true,
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Now optional
    },
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add TTL index for guest carts (expire after 30 days)
cartSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: {
      userId: { $exists: false }, // Only apply to guest carts
    },
  }
);

// ... (keep rest of schema definitions)
// Virtual for total calculation
cartSchema.virtual("total").get(function () {
  return this.items.reduce((sum: number, item: CartItemType) => {
    return sum + item.price * item.quantity;
  }, 0);
});

// Indexes
cartSchema.index({ userId: 1, clientId: 1 }, { unique: true });

const Cart = mongoose.model<CartType>("Cart", cartSchema);

export default Cart;
