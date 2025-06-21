import mongoose, { Schema } from "mongoose";

// Define the Client Type
export type ClientType = {
  _id: string;
  name: string;
  code?: string;
  phone?: string;
  email: string;
  image?: string[];

  // URLs
  urls?: {
    url?: string;
    employeePortalUrl?: string;
  };

  // Address & Contact Info
  addressDetails?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };

  // Contact Person
  contactPerson?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };

  // Company Info
  companyInfo?: {
    benefits?: {
      title?: string;
      description?: string;
      image?: string[];
    };
    culture?: {
      title?: string;
      description?: string;
      image?: string[];
    };
  };

  settings?: Record<string, any>; // Accepts any key-value pair

  // Status
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

// Define the Mongoose Schema
const clientSchema = new Schema<ClientType>(
  {
    name: { type: String, required: true },
    code: { type: String },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    image: [{ type: String }], // Change to array of strings

    // URLs
    urls: {
      url: { type: String, unique: true },
      employeePortalUrl: { type: String },
    },

    // Address
    addressDetails: {
      address1: { type: String },
      address2: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },

    // Contact Person
    contactPerson: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
    },

    // Company Info
    companyInfo: {
      benefits: {
        title: { type: String },
        description: { type: String },
        image: [{ type: String }],
      },
      culture: {
        title: { type: String },
        description: { type: String },
        image: [{ type: String }],
      },
    },

    // Dynamic Settings
    settings: {
      type: Map,
      of: Schema.Types.Mixed, // Supports boolean, string, number, etc.
      default: {},
    },

    // Status
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Middleware for updating timestamps
clientSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Indexing for fast queries
clientSchema.index({ email: 1, "urls.url": 1 }, { unique: true });

// Create the Model
const Client = mongoose.model<ClientType>("Client", clientSchema);

export default Client;
