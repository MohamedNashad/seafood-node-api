// src/models/order.model.ts
import mongoose, { Schema } from "mongoose";

export type OrderItemType = {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  type?: string; // Added to match your product types (e.g., "Tutor", "Seer Fish")
  minOrder?: string; // Added if you need to track minimum order quantities
};

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export enum CheckoutType {
  GUEST = "GUEST", // guest / express
  SIGNUP = "SIGNUP",
}

export enum PaymentMethod {
  ONLINE = "ONLINE",
  BANK_TRANSFER = "BANK_TRANSFER",
  COD = "COD",
}

export enum AddressType {
  HOME = "HOME",
  OFFICE = "OFFICE",
  OTHER = "OTHER",
}

export type OrderType = {
  _id: string;
  clientId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Made optional for guest checkout
  checkoutType: CheckoutType;
  orderItems: OrderItemType[];
  recipientInfo: {
    // Renamed from shippingInfo to match your form
    firstName: string;
    lastName?: string; // Made optional
    email: string;
    address: string;
    city: string;
    addressType?: AddressType; // Added from your form
    phone: string;
    countryCode?: string; // Added for international numbers
  };
  senderInfo?: {
    // Added for sender information (when different from recipient)
    name?: string;
    email?: string;
    phone?: string;
  };
  paymentInfo: {
    paymentMethod: PaymentMethod;
    // --- For Online Payments ---
    gatewayReference?: string; // Payment gateway's transaction ID
    maskedCardNumber?: string; // "**** **** **** 4242" (last 4 digits only)
    cardBrand?: string; // "VISA", "MASTERCARD"
    // --- For Bank Transfer ---
    bankReceiptUrl?: string; // Uploaded receipt image URL
    // --- For COD ---
    cashReceived?: boolean;
  };
  orderNotes?: string; // Added for special instructions
  subtotal: number;
  shipping: number;
  total: number;
  isPaid: boolean;
  paidAt?: Date;
  status: OrderStatus;
  isDelivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
};

const orderSchema = new mongoose.Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // Made optional
    checkoutType: {
      type: String,
      enum: Object.values(CheckoutType),
      required: true,
    },
    orderItems: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        type: { type: String }, // Added
        minOrder: { type: String }, // Added
        image: { type: String },
      },
    ],
    recipientInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      addressType: {
        type: String,
        enum: Object.values(AddressType),
      },
      phone: { type: String, required: true },
      countryCode: { type: String, default: "+94" },
    },
    senderInfo: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    paymentInfo: {
      paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true,
      },

      // --- For Online Payments ---
      gatewayReference: { type: String }, // Payment gateway's transaction ID
      maskedCardNumber: { type: String }, // "**** **** **** 4242" (last 4 digits only)
      cardBrand: { type: String }, // "VISA", "MASTERCARD", "AMEX"
      // --- For Bank Transfer ---
      bankReceiptUrl: { type: String }, // Uploaded receipt image URL
      // --- For COD ---
      cashReceived: { type: Boolean, default: false },
    },
    orderNotes: { type: String },
    subtotal: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
    },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ clientId: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ isDelivered: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "recipientInfo.email": 1 });
orderSchema.index({ "recipientInfo.phone": 1 });

const Order = mongoose.model<OrderType>("Order", orderSchema);

export default Order;
