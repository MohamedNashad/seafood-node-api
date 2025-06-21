// services/client-service.ts
import { Types } from "mongoose";
import Client, { ClientType } from "../models/client";

export const getClientEmailByUserId = async (
  email: string
): Promise<string | null> => {
  try {
    const client = await Client.findOne({ email }).select("email");
    return client?.email || null;
  } catch (error) {
    console.error("Error fetching client email:", error);
    throw new Error("Failed to fetch client email");
  }
};

export const getClientIdByEmail = async (
  email: string
): Promise<string | null> => {
  try {
    const client = await Client.findOne({ email }).select("_id");
    return client?._id || null;
  } catch (error) {
    console.error("Error fetching client id:", error);
    throw new Error("Failed to fetch client id");
  }
};

// utils/sanitize-utils.ts
type SanitizedClientType = {
  _id: string;
  name: string;
  code?: string;
  image?: string[];
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
  urls?: {
    url?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export const sanitizeClientData = (
  clientData: ClientType,
  isAdmin: boolean
): SanitizedClientType => {
  if (isAdmin) {
    return clientData; // Return all data for admins
  }

  // Create sanitized object with proper typing
  const sanitized: SanitizedClientType = {
    _id: clientData._id,
    name: clientData.name,
    code: clientData.code,
    image: clientData.image,
    companyInfo: clientData.companyInfo,
    createdAt: clientData.createdAt,
    updatedAt: clientData.updatedAt,
  };

  // Only include url if it exists
  if (clientData.urls?.url) {
    sanitized.urls = {
      url: clientData.urls.url,
    };
  }

  return sanitized;
};
