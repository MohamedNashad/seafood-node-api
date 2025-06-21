import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import mongoose from "mongoose";
import Gallery from "../models/gallery";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";
import { deleteFile, deleteFiles } from "../utils/file_handler_utils";

export const GalleryServices = {
  // create
  async createGallery(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { clientId, title, description } = req.body;
    const files = req.files as Express.Multer.File[];

    const session = await mongoose.startSession();

    try {
      // Start the transaction
      session.startTransaction();

      const existingGallery = await Gallery.findOne(
        {
          $or: [{ clientId: clientId, title: capitalizeFirstLetter(title) }],
          isDelete: false,
        },
        null,
        { session }
      );

      if (existingGallery) {
        await session.abortTransaction();
        await session.endSession();
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Gallery ${ErrorMessages.ALREADY_EXISTS}` });
      }

      // Process uploaded files
      const imagePaths = files.map((file) => {
        return file.filename; // or your preferred storage path
      });

      // Create a new gallery
      const gallery = new Gallery({
        clientId: clientId,
        title: capitalizeFirstLetter(title),
        images: imagePaths,
        description: description,
        createdBy: req.userId,
      });

      await gallery.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Gallery ${Messages.CREATE_SUCCESS}`,
        data: gallery,
      });
    } catch (error) {
      // Only abort if transaction was started
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error("Error creating gallery:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      // End session regardless of success/failure
      await session.endSession();
    }
  },

  async getAllGalleries(req: Request, res: Response) {
    try {
      // check the role and permissions
      const { userId, email } = req; // Assuming userId is in the request

      const [userPermissions, clientId] = await Promise.all([
        getUserRolesAndPermissions(userId.toString()), // Convert to string
        getClientIdByEmail(email?.toString()),
      ]);

      console.log(userPermissions, "-------userPermissions");
      console.log(clientId, "-------clientId");

      // Check permissions
      const isAdminOrSuperAdmin = userPermissions.roles.some((role) =>
        ["SUPER_ADMIN", "ADMIN"].includes(role)
      );

      const hasGalleryViewPermission =
        userPermissions.permissions.includes("GALLERY_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");
      console.log(
        hasGalleryViewPermission,
        "---------hasGalleryViewPermission"
      );

      // Authorization
      if (!hasGalleryViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let galleries;
      if (isAdminOrSuperAdmin) {
        galleries = await Gallery.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        galleries = await Gallery.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }
      res.status(HttpStatusCodes.OK).json(galleries);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "galleries!"}`,
      });
    }
  },

  async getGalleryById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const id = req.params.galleryId.toString();
    try {
      const gallery = await Gallery.findOne({
        _id: id,
      }).select("-__v");
      res.json(gallery);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "galleryId!"}`,
      });
    }
  },

  // UPDATE
  // async updateGalleryById(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const { galleryId } = req.params;

  //   // Start a session for the transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   const { clientId, title, images, description } = req.body;

  //   try {
  //     // Check if the gallery exists in the database
  //     const existingGallery = await Gallery.findById(galleryId).session(
  //       session
  //     );
  //     if (!existingGallery) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.NOT_FOUND).json({
  //         message: `Gallery ${ErrorMessages.NOT_FOUND}`,
  //       });
  //     }

  //     // Check for unique fields (code and name) if they are being updated
  //     if (clientId || title) {
  //       const conditions = [];

  //       if (clientId && title) {
  //         conditions.push({ clientId });
  //         conditions.push({ title: capitalizeFirstLetter(title) });
  //       }

  //       const duplicateGallery = await Gallery.findOne(
  //         {
  //           _id: { $ne: galleryId }, // Exclude the current gallery
  //           $or: conditions, // Ensured valid conditions only
  //           isDelete: false, // Ensure it's not a deleted gallery
  //         },
  //         null,
  //         { session }
  //       );

  //       if (duplicateGallery) {
  //         const existingFields = [];
  //         if (duplicateGallery.title === convertToUnderscoreUpperCase(title)) {
  //           existingFields.push("title");
  //         }

  //         await session.abortTransaction();
  //         return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //           message: `${
  //             ErrorMessages.FIELDS_ALREADY_EXISTS
  //           } for another gallery: ${existingFields.join(", ")}`,
  //         });
  //       }
  //     }
  //     // Update the gallery details
  //     const updatedData = {
  //       clientId: clientId ? clientId : existingGallery.clientId,
  //       title: title ? capitalizeFirstLetter(title) : existingGallery.title,
  //       images: images ? images : existingGallery.images,
  //       description: description || existingGallery.description,
  //       updatedBy: req.userId,
  //       updatedAt: new Date(),
  //     };

  //     const updatedGallery = await Gallery.findByIdAndUpdate(
  //       galleryId,
  //       updatedData,
  //       {
  //         new: true,
  //         session,
  //       }
  //     )
  //       .select("-__v")
  //       .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order;

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     if (updatedGallery) {
  //       return res.status(HttpStatusCodes.OK).json({
  //         message: `Gallery ${Messages.UPDATE_SUCCESS}`,
  //         data: updatedGallery,
  //       });
  //     }
  //   } catch (error) {
  //     // Rollback the transaction on error
  //     await session.abortTransaction();
  //     console.error("Error updating gallery:", error);
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: `${ErrorMessages.SERVER_ERROR}` });
  //   } finally {
  //     session.endSession(); // Ensures session cleanup
  //   }
  // },

  // async updateGalleryById(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const { galleryId } = req.params;
  //   const {
  //     clientId,
  //     title,
  //     description,
  //     images: existingImagePaths,
  //   } = req.body;
  //   const files = req.files as Express.Multer.File[];

  //   const session = await mongoose.startSession();

  //   try {
  //     session.startTransaction();

  //     // Check if gallery exists and is not deleted
  //     const existingGallery = await Gallery.findById(galleryId).session(
  //       session
  //     );
  //     if (!existingGallery || existingGallery.isDelete) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.NOT_FOUND).json({
  //         message: `Gallery ${ErrorMessages.NOT_FOUND}`,
  //       });
  //     }

  //     // Validate title uniqueness if being updated
  //     if (title) {
  //       const query = {
  //         _id: { $ne: galleryId },
  //         clientId: clientId || existingGallery.clientId,
  //         title: capitalizeFirstLetter(title),
  //         isDelete: false,
  //       };

  //       const duplicateGallery = await Gallery.findOne(query).session(session);
  //       if (duplicateGallery) {
  //         await session.abortTransaction();
  //         return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //           message: `Gallery title "${title}" ${ErrorMessages.ALREADY_EXISTS} for this client`,
  //         });
  //       }
  //     }

  //     // Handle file updates
  //     let finalImagePaths = existingGallery.images;

  //     // If we have existing image paths from the frontend (meaning some might have been removed)
  //     if (existingImagePaths && Array.isArray(existingImagePaths)) {
  //       // Find images that were removed
  //       const removedImages = existingGallery.images.filter(
  //         (img) => !existingImagePaths.includes(img)
  //       );

  //       // Delete the removed images
  //       if (removedImages.length > 0) {
  //         await deleteFiles(removedImages);
  //       }

  //       // Start with the kept images
  //       finalImagePaths = existingImagePaths;
  //     }

  //     // Add any newly uploaded files
  //     if (files && files.length > 0) {
  //       finalImagePaths = [
  //         ...finalImagePaths,
  //         ...files.map((file) => file.filename),
  //       ];
  //     }

  //     // Prepare updated data
  //     const updatedData = {
  //       clientId: clientId || existingGallery.clientId,
  //       title: title ? capitalizeFirstLetter(title) : existingGallery.title,
  //       images: finalImagePaths,
  //       description: description || existingGallery.description,
  //       updatedBy: req.userId,
  //       updatedAt: new Date(),
  //     };

  //     // Perform the update
  //     const updatedGallery = await Gallery.findByIdAndUpdate(
  //       galleryId,
  //       updatedData,
  //       { new: true, session }
  //     ).select("-__v");

  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `Gallery ${Messages.UPDATE_SUCCESS}`,
  //       data: updatedGallery,
  //     });
  //   } catch (error) {
  //     // Handle errors and clean up
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }
  //     console.error("Error updating gallery:", error);
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: ErrorMessages.SERVER_ERROR });
  //   } finally {
  //     await session.endSession();
  //   }
  // },
  async updateGalleryById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { galleryId } = req.params;
    const { clientId, title, description } = req.body;
    const files = req.files as Express.Multer.File[];

    // Parse existing images from the request
    let existingImagePaths: string[] = [];
    try {
      if (req.body.existingImages) {
        existingImagePaths = JSON.parse(req.body.existingImages);
      }
    } catch (e) {
      console.error("Error parsing existingImages:", e);
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Check if gallery exists and is not deleted
      const existingGallery = await Gallery.findById(galleryId).session(
        session
      );
      if (!existingGallery || existingGallery.isDelete) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Gallery ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Validate title uniqueness if being updated
      if (title) {
        const query = {
          _id: { $ne: galleryId },
          clientId: clientId || existingGallery.clientId,
          title: capitalizeFirstLetter(title),
          isDelete: false,
        };

        const duplicateGallery = await Gallery.findOne(query).session(session);
        if (duplicateGallery) {
          await session.abortTransaction();
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: `Gallery title "${title}" ${ErrorMessages.ALREADY_EXISTS} for this client`,
          });
        }
      }

      // Handle file updates
      let finalImagePaths = existingImagePaths;

      // Add newly uploaded files
      if (files && files.length > 0) {
        finalImagePaths = [
          ...finalImagePaths,
          ...files.map((file) => file.filename),
        ];
      }

      // Find and delete images that were removed
      const removedImages = existingGallery.images.filter(
        (img) => !finalImagePaths.includes(img)
      );

      if (removedImages.length > 0) {
        await deleteFiles("gallery", removedImages);
        // await deleteFile("gallery", removedImages);
      }

      // Prepare updated data
      const updatedData = {
        clientId: clientId || existingGallery.clientId,
        title: title ? capitalizeFirstLetter(title) : existingGallery.title,
        images: finalImagePaths,
        description: description || existingGallery.description,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      // Perform the update
      const updatedGallery = await Gallery.findByIdAndUpdate(
        galleryId,
        updatedData,
        { new: true, session }
      ).select("-__v");

      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Gallery ${Messages.UPDATE_SUCCESS}`,
        data: updatedGallery,
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error("Error updating gallery:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      await session.endSession();
    }
  },

  async softDeleteGalleryById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { galleryId } = req.params;
      // Find the gallery and mark it as deleted (soft delete)
      const updatedGallery = await Gallery.findByIdAndUpdate(
        galleryId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedGallery) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Gallery not found with ID: ${galleryId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Gallery ${Messages.MARKED_AS_DELETED}`,
        data: updatedGallery,
      });
    } catch (error) {
      await session.abortTransaction();
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }
  },

  async activateGalleryById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { galleryId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedGallery = await Gallery.findByIdAndUpdate(
        galleryId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedGallery) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Gallery not found with ID: ${galleryId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Gallery ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedGallery,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating gallery:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Gallery ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deleteGalleryById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { galleryId } = req.params;

      const gallery = await Gallery.findOneAndDelete(
        { _id: galleryId, isDelete: true },
        { session }
      );

      if (!gallery) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (gallery.images && gallery.images.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("gallery", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(gallery.images);
      }

      // Commit the transaction after successful deletion
      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Gallery ${Messages.DELETE_SUCCESS}`,
        data: gallery,
      });
    } catch (error) {
      await session.abortTransaction();
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
