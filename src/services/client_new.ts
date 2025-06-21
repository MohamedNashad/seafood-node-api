import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import mongoose from "mongoose";
import Client from "../models/client";
import { uploadImages, uploadImageToCloudinary } from "../utils/files_utils";
import cloudinary from "cloudinary";

export const ClientServices = {
  async createClient(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(req.file, "-------req.body-client");

      // Parse JSON fields from FormData
      const clientData = {
        ...req.body,
        urls: req.body.urls ? JSON.parse(req.body.urls) : undefined,
        addressDetails: req.body.addressDetails
          ? JSON.parse(req.body.addressDetails)
          : undefined,
        contactPerson: req.body.contactPerson
          ? JSON.parse(req.body.contactPerson)
          : undefined,
        companyInfo: req.body.companyInfo
          ? JSON.parse(req.body.companyInfo)
          : undefined,
        settings: req.body.settings ? JSON.parse(req.body.settings) : undefined,
      };

      // In your create/update service
      let imageUrl = null;

      if (req.file) {
        imageUrl = await uploadImageToCloudinary(req.file);
      } else if (req.body.imageUrl) {
        // Use existing URL if no new file was uploaded
        imageUrl = req.body.imageUrl;
      }

      const existingClient = await Client.findOne({
        $or: [
          { email: clientData?.email },
          //   { code: convertToUnderscoreUpperCase(code) },
          { "urls.url": clientData.urls?.url },
        ],
        isDelete: false,
      }).session(session);

      if (existingClient) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Client ${ErrorMessages.ALREADY_EXISTS}` });
      }

      // Create new client
      const client = new Client({
        ...clientData,
        image: imageUrl,
        createdBy: req.userId,
      });
      console.log(client, "-----client");

      await client.save({ session });
      await session.commitTransaction();

      return res
        .status(HttpStatusCodes.CREATED)
        .json({ message: `Client ${Messages.CREATE_SUCCESS}`, data: client });
    } catch (error) {
      await session.abortTransaction();
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },

  async getAllClients(req: Request, res: Response) {
    try {
      const clients = await Client.find()
        .select("-__v")
        .sort({ updatedAt: -1 });
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
    const { clientId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Parse JSON fields from FormData
      const updates = {
        ...req.body,
        urls: req.body.urls ? JSON.parse(req.body.urls) : undefined,
        addressDetails: req.body.addressDetails
          ? JSON.parse(req.body.addressDetails)
          : undefined,
        contactPerson: req.body.contactPerson
          ? JSON.parse(req.body.contactPerson)
          : undefined,
        companyInfo: req.body.companyInfo
          ? JSON.parse(req.body.companyInfo)
          : undefined,
        settings: req.body.settings ? JSON.parse(req.body.settings) : undefined,
      };

      const existingClient = await Client.findById(clientId).session(session);
      if (!existingClient) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: ErrorMessages.NOT_FOUND,
        });
      }

      // Handle image upload/update
      let imageUrls = existingClient.image || []; // Default to existing images

      if (req.file) {
        // Upload new image to Cloudinary
        const newImageUrl = await uploadImageToCloudinary(req.file);

        // Delete old images from Cloudinary if they exist
        if (existingClient.image && existingClient.image.length > 0) {
          await Promise.all(
            existingClient.image.map(async (url) => {
              try {
                const publicId = url.split("/").pop()?.split(".")[0];
                if (publicId) {
                  await cloudinary.v2.uploader.destroy(publicId);
                }
              } catch (error) {
                console.error(
                  "Error deleting old image from Cloudinary:",
                  error
                );
              }
            })
          );
        }

        // Replace all existing images with the new one
        imageUrls = [newImageUrl];
      } else if (req.body.imageUrl) {
        // Use explicitly provided URL(s)
        imageUrls = Array.isArray(req.body.imageUrl)
          ? req.body.imageUrl
          : [req.body.imageUrl];
      }

      // Prepare updates
      if (updates.name) updates.name = capitalizeFirstLetter(updates.name);
      if (updates.code)
        updates.code = convertToUnderscoreUpperCase(updates.code);

      const finalUpdates = {
        ...updates,
        image: imageUrls, // Now properly typed as string[]
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      const updatedClient = await Client.findByIdAndUpdate(
        clientId,
        finalUpdates,
        { new: true, session }
      ).select("-__v");

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Client ${Messages.UPDATE_SUCCESS}`,
        data: updatedClient,
      });
    } catch (error) {
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

      await session.commitTransaction();
      res
        .status(HttpStatusCodes.OK)
        .json({ message: `Client ${Messages.DELETE_SUCCESS}`, data: client });
    } catch (error) {
      await session.abortTransaction();
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
