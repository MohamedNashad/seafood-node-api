import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import Client from "../models/client";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import { deleteFile, getFileUrl } from "../utils/file_handler_utils";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import {
  getClientEmailByUserId,
  sanitizeClientData,
} from "../utils/client_utils";
import { Types } from "mongoose";

interface UploadedFiles {
  image?: Express.Multer.File[];
  benefitsImage?: Express.Multer.File[];
  cultureImage?: Express.Multer.File[];
}

export const ClientServices = {
  async createClient(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Cleanup uploaded file if validation fails
      if ((req as any).file) {
        // Temporary any cast for single file
        deleteFile("client", (req as any).file.filename);
      }
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Type assertion for req.files
      const files = req.files as UploadedFiles;

      // Handle file upload (if any)
      const imagePath = files?.image?.[0]?.filename || null;
      const benefitsImagePath = files?.benefitsImage?.[0]?.filename || null;
      const cultureImagePath = files?.cultureImage?.[0]?.filename || null;

      // Parse and transform fields
      const clientData = {
        ...req.body,
        name: req.body.name ? capitalizeFirstLetter(req.body.name) : undefined,
        code: req.body.code
          ? convertToUnderscoreUpperCase(req.body.code)
          : undefined,
        urls: req.body.urls ? JSON.parse(req.body.urls) : undefined,
        addressDetails: req.body.addressDetails
          ? JSON.parse(req.body.addressDetails)
          : undefined,
        contactPerson: req.body.contactPerson
          ? JSON.parse(req.body.contactPerson)
          : undefined,
        companyInfo: req.body.companyInfo
          ? JSON.parse(req.body.companyInfo)
          : {
              benefits: {},
              culture: {},
            },
        settings: req.body.settings ? JSON.parse(req.body.settings) : undefined,
      };

      // Add images to companyInfo if they exist
      if (benefitsImagePath) {
        clientData.companyInfo.benefits.image = [benefitsImagePath];
      }
      if (cultureImagePath) {
        clientData.companyInfo.culture.image = [cultureImagePath];
      }

      // Check for existing client
      const existingClient = await Client.findOne({
        $or: [
          { email: clientData.email },
          { code: clientData.code },
          { "urls.url": clientData.urls?.url },
        ],
        isDelete: false,
      }).session(session);

      if (existingClient) {
        // Cleanup all uploaded files if client already exists
        if (files?.image?.[0]) deleteFile("client", files.image[0].filename);
        if (files?.benefitsImage?.[0])
          deleteFile("client", files.benefitsImage[0].filename);
        if (files?.cultureImage?.[0])
          deleteFile("client", files.cultureImage[0].filename);

        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Client ${ErrorMessages.ALREADY_EXISTS}` });
      }

      // Create new client with formatted data
      const client = new Client({
        ...clientData,
        image: imagePath ? [imagePath] : [],
        createdBy: req.userId,
      });

      await client.save({ session });
      await session.commitTransaction();

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Client ${Messages.CREATE_SUCCESS}`,
        data: {
          ...client.toObject(),
          imageUrl: imagePath ? getFileUrl(req, "client", imagePath) : null,
        },
      });
    } catch (error) {
      // Cleanup all uploaded files if error occurs
      const files = req.files as UploadedFiles;
      if (files?.image?.[0]) deleteFile("client", files.image[0].filename);
      if (files?.benefitsImage?.[0])
        deleteFile("client", files.benefitsImage[0].filename);
      if (files?.cultureImage?.[0])
        deleteFile("client", files.cultureImage[0].filename);

      await session.abortTransaction();
      console.error("Error creating client:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },

  async getAllClients(req: Request, res: Response) {
    try {
      // check the role and permissions
      const { userId, email } = req; // Assuming userId is in the request

      const [userPermissions, clientEmail] = await Promise.all([
        getUserRolesAndPermissions(userId.toString()), // Convert to string
        getClientEmailByUserId(email?.toString()),
      ]);

      console.log(userPermissions,'-------userPermissions');
      console.log(clientEmail,'-------clientEmail');
      
      // Check permissions
      const isAdminOrSuperAdmin = userPermissions.roles.some((role) =>
        ["SUPER_ADMIN", "ADMIN"].includes(role)
      );

      const hasClientViewPermission =
        userPermissions.permissions.includes("CLIENT_VIEW");
      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasClientViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let clients;
      if (isAdminOrSuperAdmin) {
        // Admins see all clients
        clients = await Client.find().select("-__v").sort({ updatedAt: -1 });
      } else if (isClientRole && clientEmail) {
        // Clients see only their records
        clients = await Client.find({ email: clientEmail })
          .select("-__v")
          .sort({ updatedAt: -1 });
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // clients = await Client.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      // Additional security filter for sensitive fields
      // const sanitizedClients = clients.map((client) => {
      //   return sanitizeClientData(client.toObject(), isAdminOrSuperAdmin);
      // });

      res.status(HttpStatusCodes.OK).json(clients);
    } catch (error) {
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.FETCHING_ERROR} clients!` });
    }
  },

  async getClientById(req: Request, res: Response) {
    const { clientId } = req.params;
    try {
      const client = await Client.findOne({
        _id: clientId,
        isDelete: false,
      }).select("-__v");
      if (!client)
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      res.json(client);
    } catch (error) {
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.FETCHING_ERROR} client!` });
    }
  },

  async updateClientById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { clientId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Type assertion for req.files
      const files = req.files as UploadedFiles;

      // Handle all file uploads
      const imagePath = files?.image?.[0]?.filename || null;
      const benefitsImagePath = files?.benefitsImage?.[0]?.filename || null;
      const cultureImagePath = files?.cultureImage?.[0]?.filename || null;

      const existingClient = await Client.findById(clientId).session(session);

      // Parse JSON fields from FormData
      const updates = {
        ...req.body,
        name: req.body.name ? capitalizeFirstLetter(req.body.name) : undefined,
        code: req.body.code
          ? convertToUnderscoreUpperCase(req.body.code)
          : undefined,
        urls: req.body.urls ? JSON.parse(req.body.urls) : undefined,
        addressDetails: req.body.addressDetails
          ? JSON.parse(req.body.addressDetails)
          : undefined,
        contactPerson: req.body.contactPerson
          ? JSON.parse(req.body.contactPerson)
          : undefined,
        companyInfo: req.body.companyInfo
          ? JSON.parse(req.body.companyInfo)
          : {
              benefits: existingClient?.companyInfo?.benefits || {},
              culture: existingClient?.companyInfo?.culture || {},
            },
        settings: req.body.settings ? JSON.parse(req.body.settings) : undefined,
      };

      if (!existingClient) {
        // Cleanup all uploaded files if client doesn't exist
        if (files?.image?.[0]) deleteFile("client", files.image[0].filename);
        if (files?.benefitsImage?.[0])
          deleteFile("client", files.benefitsImage[0].filename);
        if (files?.cultureImage?.[0])
          deleteFile("client", files.cultureImage[0].filename);

        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: ErrorMessages.NOT_FOUND,
        });
      }

      // Handle image updates
      let imageUrls = existingClient.image || [];
      let benefitsImage = existingClient.companyInfo?.benefits?.image || [];
      let cultureImage = existingClient.companyInfo?.culture?.image || [];

      // Process client image
      if (imagePath) {
        // Delete old client images
        if (existingClient.image?.length) {
          existingClient.image.forEach((img) => deleteFile("client", img));
        }
        imageUrls = [imagePath];
      } else if (req.body.image) {
        // Use explicitly provided URL(s)
        imageUrls = Array.isArray(req.body.image)
          ? req.body.image
          : [req.body.image];
      }

      // Process benefits image
      if (benefitsImagePath) {
        // Delete old benefits image
        if (existingClient.companyInfo?.benefits?.image?.length) {
          existingClient.companyInfo.benefits.image.forEach((img) =>
            deleteFile("client", img)
          );
        }
        updates.companyInfo.benefits = updates.companyInfo.benefits || {};
        updates.companyInfo.benefits.image = [benefitsImagePath];
      } else if (req.body.companyInfo?.benefits?.image) {
        // Handle case where image is passed in body (URL or existing filename)
        updates.companyInfo.benefits = updates.companyInfo.benefits || {};
        updates.companyInfo.benefits.image = Array.isArray(
          req.body.companyInfo.benefits.image
        )
          ? req.body.companyInfo.benefits.image
          : [req.body.companyInfo.benefits.image];
      }

      // Process culture image
      if (cultureImagePath) {
        // Delete old culture image
        if (existingClient.companyInfo?.culture?.image?.length) {
          existingClient.companyInfo.culture.image.forEach((img) =>
            deleteFile("client", img)
          );
        }
        updates.companyInfo.culture = updates.companyInfo.culture || {};
        updates.companyInfo.culture.image = [cultureImagePath];
      } else if (req.body.companyInfo?.culture?.image) {
        // Handle case where image is passed in body (URL or existing filename)
        updates.companyInfo.culture = updates.companyInfo.culture || {};
        updates.companyInfo.culture.image = Array.isArray(
          req.body.companyInfo.culture.image
        )
          ? req.body.companyInfo.culture.image
          : [req.body.companyInfo.culture.image];
      }

      const finalUpdates = {
        ...updates,
        image: imageUrls,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        finalUpdates,
        { new: true, session }
      ).select("-__v");

      if (!updatedClient) {
        throw new Error("Client update failed");
      }

      await session.commitTransaction();

      // Safely handle all image arrays
      const responseData = {
        ...updatedClient.toObject(),
        imageUrls: (updatedClient.image || []).map((img) =>
          getFileUrl(req, "client", img)
        ),
        benefitsImageUrl: (
          updatedClient.companyInfo?.benefits?.image || []
        ).map((img) => getFileUrl(req, "client", img))[0],
        cultureImageUrl: (updatedClient.companyInfo?.culture?.image || []).map(
          (img) => getFileUrl(req, "client", img)
        )[0],
      };

      return res.status(HttpStatusCodes.OK).json({
        message: `Client ${Messages.UPDATE_SUCCESS}`,
        data: responseData,
      });
    } catch (error) {
      // Cleanup all uploaded files if error occurs
      const files = req.files as UploadedFiles;
      if (files?.image?.[0]) deleteFile("client", files.image[0].filename);
      if (files?.benefitsImage?.[0])
        deleteFile("client", files.benefitsImage[0].filename);
      if (files?.cultureImage?.[0])
        deleteFile("client", files.cultureImage[0].filename);

      await session.abortTransaction();
      console.error("Error updating client:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }
  },

  async softDeleteClientById(req: Request, res: Response) {
    const { clientId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedClient) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      await session.commitTransaction();
      res.status(HttpStatusCodes.OK).json({
        message: `Client ${Messages.MARKED_AS_DELETED}`,
        data: updatedClient,
      });
    } catch (error) {
      await session.abortTransaction();
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },

  async activateClientById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { clientId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedClient) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Client not found with ID: ${clientId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Client ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedClient,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating client:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Client ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deleteClientById(req: Request, res: Response) {
    const { clientId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const client = await Client.findOneAndDelete(
        { _id: clientId, isDelete: true },
        { session }
      );

      if (!client) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete all associated images with error handling for each
      const deleteFilesSafely = async (files: string | string[]) => {
        const filesArray = Array.isArray(files) ? files : [files];
        for (const file of filesArray) {
          try {
            if (file) {
              await deleteFile("client", file);
            }
          } catch (err) {
            console.error(`Error deleting file ${file}:`, err);
            // Continue with other files even if one fails
          }
        }
      };

      // Delete client images
      if (client.image && client.image.length > 0) {
        await deleteFilesSafely(client.image);
      }

      // Delete company info images
      if (client.companyInfo?.benefits?.image) {
        await deleteFilesSafely(client.companyInfo.benefits.image);
      }

      if (client.companyInfo?.culture?.image) {
        await deleteFilesSafely(client.companyInfo.culture.image);
      }

      await session.commitTransaction();
      res.status(HttpStatusCodes.OK).json({
        message: `Client ${Messages.DELETE_SUCCESS}`,
        data: {
          ...client.toObject(),
          // Include any additional cleanup information if needed
        },
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting client:", error);
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }
  },
};
