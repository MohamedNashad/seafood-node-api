import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import About from "../models/about";
import { capitalizeFirstLetter } from "../utils/convert_text_utils";
import { deleteFile, getFileUrl } from "../utils/file_handler_utils";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import {
  getClientEmailByUserId,
  getClientIdByEmail,
} from "../utils/client_utils";

interface UploadedFiles {
  image?: Express.Multer.File[];
}

export const AboutServices = {
  // create
  async createAbout(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Cleanup uploaded file if validation fails
      if (req.file) {
        deleteFile("about", req.file.filename);
      }
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Type assertion for req.files
      const files = req.files as UploadedFiles;

      // Handle file upload
      const imagePath = files?.image?.[0]?.filename || null;

      // Parse and transform fields
      const { clientId, title, description } = req.body;

      const existingAbout = await About.findOne(
        {
          $or: [{ clientId: clientId, title: capitalizeFirstLetter(title) }],
          isDelete: false,
        },
        null,
        { session }
      );

      if (existingAbout) {
        // Cleanup uploaded file if about already exists
        if (files?.image?.[0]) {
          deleteFile("about", files.image[0].filename);
        }
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes?.BAD_REQUEST)
          .json({ message: `About ${ErrorMessages?.ALREADY_EXISTS}` });
      }
      // Create a new about
      const about = new About({
        clientId: clientId,
        title: capitalizeFirstLetter(title),
        image: imagePath ? [imagePath] : [],
        description: capitalizeFirstLetter(description),
        createdBy: req.userId,
      });

      await about.save({ session });
      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.CREATED).json({
        message: `About ${Messages.CREATE_SUCCESS}`,
        data: {
          ...about.toObject(),
          imageUrl: imagePath ? getFileUrl(req, "about", imagePath) : null,
        },
      });
    } catch (error) {
      // Cleanup uploaded file if error occurs
      const files = req.files as UploadedFiles;
      if (files?.image?.[0]) {
        deleteFile("about", files.image[0].filename);
      }
      // Rollback the transaction in case of error
      await session.abortTransaction();
      return res
        .status(HttpStatusCodes?.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages?.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async getAllAbout(req: Request, res: Response) {
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

      const hasAboutViewPermission =
        userPermissions.permissions.includes("ABOUT_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasAboutViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let abouts;
      if (isAdminOrSuperAdmin) {
        abouts = await About.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        // Clients see only their records
        abouts = await About.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 });
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      res.status(HttpStatusCodes.OK).json(abouts);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "abouts!"}`,
      });
    }
  },

  async getAboutById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const id = req.params.aboutId.toString();
    try {
      const about = await About.findOne({
        _id: id,
      }).select("-__v");
      res.json(about);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "aboutId!"}`,
      });
    }
  },

  // UPDATE
  async updateAboutById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Cleanup uploaded file if validation fails
      if ((req as any).file) {
        deleteFile("about", (req as any).file.filename);
      }
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const { aboutId } = req.params;

    // const { clientId, title, image, description } = req.body;

    try {
      // Type assertion for req.files
      const files = req.files as UploadedFiles;

      // Handle file upload
      const imagePath = files?.image?.[0]?.filename || null;
      // Check if the about exists in the database
      const existingAbout = await About.findById(aboutId).session(session);
      if (!existingAbout) {
        // Cleanup uploaded file if about doesn't exist
        if (files?.image?.[0]) {
          deleteFile("about", files.image[0].filename);
        }
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `About ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Handle image update
      let imageUrls = existingAbout.image || [];
      if (imagePath) {
        // Delete old images if they exist
        if (existingAbout.image?.length) {
          existingAbout.image.forEach((img) => deleteFile("about", img));
        }
        imageUrls = [imagePath];
      } else if (req.body.image) {
        // Use explicitly provided URL(s)
        imageUrls = Array.isArray(req.body.image)
          ? req.body.image
          : [req.body.image];
      }

      // Check for unique fields (code and name) if they are being updated
      // if (clientId || title) {
      //   const conditions = [];

      //   if (clientId && title) {
      //     conditions.push({ clientId });
      //     conditions.push({ title: capitalizeFirstLetter(title) });
      //   }

      //   const duplicateAbout = await About.findOne(
      //     {
      //       _id: { $ne: aboutId }, // Exclude the current about
      //       $or: conditions, // Ensured valid conditions only
      //       isDelete: false, // Ensure it's not a deleted about
      //     },
      //     null,
      //     { session }
      //   );

      //   if (duplicateAbout) {
      //     const existingFields = [];
      //     if (duplicateAbout.title === convertToUnderscoreUpperCase(title)) {
      //       existingFields.push("title");
      //     }

      //     await session.abortTransaction();
      //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
      //       message: `${
      //         ErrorMessages.FIELDS_ALREADY_EXISTS
      //       } for another about: ${existingFields.join(", ")}`,
      //     });
      //   }
      // }
      // Update the about details
      // const updatedData = {
      //   clientId: clientId ? clientId : existingAbout.clientId,
      //   title: title ? capitalizeFirstLetter(title) : existingAbout.title,
      //   image: image ? image : existingAbout.image,
      //   description: description || existingAbout.description,
      //   updatedBy: req.userId,
      //   updatedAt: new Date(),
      // };
      // Update the about details
      const updatedData = {
        clientId: req.body.clientId || existingAbout.clientId,
        title: req.body.title
          ? capitalizeFirstLetter(req.body.title)
          : existingAbout.title,
        description: req.body.description || existingAbout.description,
        image: imageUrls,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      const updatedAbout = await About.findByIdAndUpdate(aboutId, updatedData, {
        new: true,
        session,
      })
        .select("-__v")
        .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order;

      if (!updatedAbout) {
        throw new Error("About update failed");
      }
      // Commit the transaction
      await session.commitTransaction();

      // if (updatedAbout) {
      //   return res.status(HttpStatusCodes.OK).json({
      //     message: `About ${Messages.UPDATE_SUCCESS}`,
      //     // data: updatedAbout,
      //     data: {
      //       ...updatedAbout.toObject(),
      //       imageUrl:
      //         imageUrls.length > 0
      //           ? getFileUrl(req, "about", imageUrls[0])
      //           : null,
      //     },
      //   });
      // }
      return res.status(HttpStatusCodes.OK).json({
        message: `About ${Messages.UPDATE_SUCCESS}`,
        data: {
          ...updatedAbout.toObject(),
          imageUrl:
            imageUrls.length > 0
              ? getFileUrl(req, "about", imageUrls[0])
              : null,
        },
      });
    } catch (error) {
      // Cleanup uploaded file if error occurs
      const files = req.files as UploadedFiles;
      if (files?.image?.[0]) {
        deleteFile("about", files.image[0].filename);
      }
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Error updating about:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async softDeleteAboutById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { aboutId } = req.params;
      // Find the about and mark it as deleted (soft delete)
      const updatedAbout = await About.findByIdAndUpdate(
        aboutId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedAbout) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `About not found with ID: ${aboutId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `About ${Messages.MARKED_AS_DELETED}`,
        data: updatedAbout,
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

  async activateAboutById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { aboutId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedAbout = await About.findByIdAndUpdate(
        aboutId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedAbout) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `About not found with ID: ${aboutId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `About ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedAbout,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating about:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `About ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  // async deleteAboutById(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const { aboutId } = req.params;

  //     const about = await About.findOneAndDelete(
  //       { _id: aboutId, isDelete: true },
  //       { session }
  //     );

  //     if (!about) {
  //       await session.abortTransaction();
  //       return res
  //         .status(HttpStatusCodes.NOT_FOUND)
  //         .json({ message: ErrorMessages.NOT_FOUND });
  //     }

  //     // Commit the transaction after successful deletion
  //     await session.commitTransaction();
  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `About ${Messages.DELETE_SUCCESS}`,
  //       data: about,
  //     });
  //   } catch (error) {
  //     await session.abortTransaction();
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: ErrorMessages.SERVER_ERROR });
  //   } finally {
  //     session.endSession();
  //   }
  // },
  // async deleteAboutById(req: Request, res: Response) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     const { aboutId } = req.params;
  //     const about = await About.findOneAndDelete(
  //       { _id: aboutId, isDelete: true },
  //       { session }
  //     );

  //     if (!about) {
  //       await session.abortTransaction();
  //       return res
  //         .status(HttpStatusCodes.NOT_FOUND)
  //         .json({ message: ErrorMessages.NOT_FOUND });
  //     }

  //     // Delete associated images
  //     if (about.image && about.image.length > 0) {
  //       about.image.forEach((img) => deleteFile("about", img));
  //     }

  //     await session.commitTransaction();
  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `About ${Messages.DELETE_SUCCESS}`,
  //       data: about,
  //     });
  //   } catch (error) {
  //     await session.abortTransaction();
  //     console.error("Error deleting about:", error);
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: ErrorMessages.SERVER_ERROR });
  //   } finally {
  //     session.endSession();
  //   }
  // },
  async deleteAboutById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { aboutId } = req.params;
      const about = await About.findOneAndDelete(
        { _id: aboutId, isDelete: true },
        { session }
      );

      if (!about) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (about.image && about.image.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("about", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(about.image);
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `About ${Messages.DELETE_SUCCESS}`,
        data: about,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting about:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
