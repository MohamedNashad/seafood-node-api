import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import { capitalizeFirstLetter } from "../utils/convert_text_utils";
import mongoose, { ClientSession } from "mongoose";
import Slider from "../models/slider";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { deleteFile } from "../utils/file_handler_utils";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";

export const SliderServices = {
  // Create Slider
  // async createSlider(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const { sliders } = req.body;

  //   // Start a session for transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Check if any slider already exists with the same clientId and title
  //     const existingSliders = await Promise.all(
  //       sliders.map(async (slider: any) => {
  //         return await Slider.findOne(
  //           {
  //             clientId: slider.clientId,
  //             title: capitalizeFirstLetter(slider.title),
  //             isDelete: false,
  //           },
  //           null,
  //           { session }
  //         );
  //       })
  //     );

  //     if (existingSliders.some((slider) => slider !== null)) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `One or more sliders ${ErrorMessages.ALREADY_EXISTS}`,
  //       });
  //     }

  //     // Create new sliders
  //     const createdSliders = await Promise.all(
  //       sliders.map(async (slider: any) => {
  //         const newSlider = new Slider({
  //           clientId: slider.clientId,
  //           title: capitalizeFirstLetter(slider.title),
  //           buttonUrl: slider.buttonUrl,
  //           description: slider.description,
  //           image: slider.image,
  //           status: slider.status,
  //           createdBy: req.userId,
  //         });
  //         return await newSlider.save({ session });
  //       })
  //     );

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Sliders ${Messages.CREATE_SUCCESS}`,
  //       data: createdSliders,
  //     });
  //   } catch (error) {
  //     // Rollback the transaction in case of error
  //     await session.abortTransaction();
  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //     });
  //   } finally {
  //     session.endSession(); // Ensures session cleanup
  //   }
  // },

  // async createSlider(req: Request, res: Response) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Debug logging
  //     console.log("Request body:", req.body);
  //     console.log("Request files:", req.files);

  //     // Validate request contains sliders data
  //     if (!req.body.sliders) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Sliders data is required",
  //       });
  //     }

  //     // Parse the JSON string from form data
  //     let sliders;
  //     try {
  //       sliders = JSON.parse(req.body.sliders);
  //       console.log(sliders,'-----SLIRRE');

  //     } catch (error) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Invalid sliders data format",
  //       });
  //     }
  //     // Generate a unique groupId for this batch of sliders
  //     const groupId = uuidv4();
  //     // Process files if they exist
  //     const files = (req.files as Express.Multer.File[]) || [];
  //     const processedSliders = sliders.map((slider: any, index: number) => {
  //       const fileField = `sliders[${index}][image]`;
  //       const file = files.find((f) => f.fieldname === fileField);

  //       // Here you should handle file storage (save to disk, S3, etc.)
  //       // For now, we'll just use the buffer, but in production you should:
  //       // 1. Save the file to persistent storage
  //       // 2. Get the URL/path
  //       // 3. Store that in the database instead of the buffer
  //       return {
  //         ...slider,
  //         groupId: groupId, // All sliders in this batch get the same groupId
  //         image: file ? file.buffer : slider.image,
  //       };
  //     });

  //     // Check for existing sliders
  //     const existingSliders = await Promise.all(
  //       processedSliders.map(async (slider: any) => {
  //         return await Slider.findOne(
  //           {
  //             clientId: slider.clientId,
  //             title: capitalizeFirstLetter(slider.title),
  //             isDelete: false,
  //           },
  //           null,
  //           { session }
  //         );
  //       })
  //     );

  //     // if (existingSliders.some((slider) => slider !== null)) {
  //     //   await session.abortTransaction();
  //     //   return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //     //     message: `One or more sliders ${ErrorMessages.ALREADY_EXISTS}`,
  //     //   });
  //     // }
  //     const existingSlider = existingSliders.find((s) => s !== null);
  //     if (existingSlider) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `Slider "${existingSlider.title}" already exists`,
  //       });
  //     }

  //     // Create new sliders with processed data
  //     const createdSliders = await Promise.all(
  //       processedSliders.map(async (slider: any) => {
  //         const newSlider = new Slider({
  //           groupId: groupId,
  //           clientId: slider.clientId,
  //           title: capitalizeFirstLetter(slider.title),
  //           buttonUrl: slider.buttonUrl,
  //           description: slider.description,
  //           image: slider.image, // This now contains either the existing image or new file buffer
  //           status: slider.status,
  //           createdBy: req.userId,
  //         });
  //         return await newSlider.save({ session });
  //       })
  //     );

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Sliders ${Messages.CREATE_SUCCESS}`,
  //       data: createdSliders,
  //       // groupId: groupId // Return the generated groupId to the client
  //     });
  //   } catch (error: any) {
  //     // Rollback the transaction in case of error
  //     await session.abortTransaction();
  //     console.error("Error creating sliders:", error);

  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //       error: error.message, // Only include in development
  //     });
  //   } finally {
  //     session.endSession();
  //   }
  // },

  // async createSlider(req: Request, res: Response) {
  //   // Create a new session
  //   const session = await mongoose.startSession();

  //   try {
  //     await session.startTransaction();

  //     // Debug logging
  //     console.log("Request body:", req.body);
  //     console.log("Request files:", req.files);

  //     // Validate request contains sliders data
  //     if (!req.body.sliders) {
  //       await session.abortTransaction();
  //       await session.endSession();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Sliders data is required",
  //       });
  //     }

  //     // Parse the JSON string from form data
  //     let sliders;
  //     try {
  //       sliders = JSON.parse(req.body.sliders);
  //       console.log(sliders, "-----SLIDERS");
  //     } catch (error) {
  //       await session.abortTransaction();
  //       await session.endSession();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Invalid sliders data format",
  //       });
  //     }

  //     // Generate a unique groupId for this batch
  //     const groupId = uuidv4();

  //     // Process files if they exist
  //     const files = (req.files as Express.Multer.File[]) || [];
  //     const processedSliders = sliders.map((slider: any, index: number) => {
  //       const fileField = `sliders[${index}][image]`;
  //       const file = files.find((f) => f.fieldname === fileField);

  //       return {
  //         ...slider,
  //         groupId: groupId,
  //         image: file ? file.buffer : slider.image,
  //         // Ensure all required fields are set
  //         slug: null,
  //         name: null,
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       };
  //     });

  //     // Check for existing sliders - simplified to single query
  //     const existingSlider = await Slider.findOne({
  //       clientId: processedSliders[0].clientId,
  //       title: {
  //         $in: processedSliders.map((s: any) => capitalizeFirstLetter(s.title)),
  //       },
  //       isDelete: false,
  //     }).session(session);

  //     if (existingSlider) {
  //       await session.abortTransaction();
  //       await session.endSession();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `Slider "${existingSlider.title}" already exists`,
  //       });
  //     }

  //     // Create new sliders
  //     const createdSliders = await Slider.insertMany(
  //       processedSliders.map((slider: any) => ({
  //         groupId: groupId,
  //         clientId: slider.clientId,
  //         title: capitalizeFirstLetter(slider.title),
  //         buttonUrl: slider.buttonUrl,
  //         description: slider.description,
  //         image: slider.image,
  //         status: slider.status,
  //         createdBy: req.userId,
  //         slug: null,
  //         name: null,
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       })),
  //       { session }
  //     );

  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Sliders ${Messages.CREATE_SUCCESS}`,
  //       data: createdSliders,
  //       groupId: groupId,
  //     });
  //   } catch (error: any) {
  //     // Handle transaction errors specifically
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }

  //     console.error("Error creating sliders:", error);

  //     // Handle duplicate key errors
  //     if (error.code === 11000) {
  //       return res.status(HttpStatusCodes.CONFLICT).json({
  //         message: "Duplicate slider detected",
  //         details: error.message,
  //       });
  //     }

  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //       error:
  //         process.env.NODE_ENV === "development" ? error.message : undefined,
  //     });
  //   } finally {
  //     if (session) {
  //       await session.endSession();
  //     }
  //   }
  // },

  // Get All Sliders

  // async createSlider(req: Request, res: Response) {
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Debug logging
  //     console.log("Request body:", req.body);
  //     console.log("Request files:", req.files);

  //     // Validate request contains sliders data
  //     if (!req.body.sliders) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Sliders data is required",
  //       });
  //     }

  //     // Parse the JSON string from form data
  //     let sliders;
  //     try {
  //       sliders = JSON.parse(req.body.sliders);
  //       if (!Array.isArray(sliders)) {
  //         throw new Error("Sliders data must be an array");
  //       }
  //     } catch (error) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Invalid sliders data format",
  //       });
  //     }

  //     // Generate a unique groupId for this batch
  //     const groupId = uuidv4();

  //     // Process files if they exist
  //     const files = (req.files as Express.Multer.File[]) || [];
  //     const processedSliders = sliders.map((slider: any, index: number) => {
  //       const fileField = `sliders[${index}][image]`;
  //       const file = files.find((f) => f.fieldname === fileField);

  //       return {
  //         ...slider,
  //         groupId: groupId,
  //         // Store only the filename in database
  //         // image: file ? `/uploads/sliders/${file.filename}` : slider.image,
  //         image: file ? `${file.filename}` : slider.image,
  //         // Set other required fields
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       };
  //     });

  //     // Check for existing sliders
  //     const existingSliders = await Promise.all(
  //       processedSliders.map(async (slider: any) => {
  //         return await Slider.findOne(
  //           {
  //             clientId: slider.clientId,
  //             title: capitalizeFirstLetter(slider.title),
  //             isDelete: false,
  //           },
  //           null,
  //           { session }
  //         );
  //       })
  //     );

  //     const existingSlider = existingSliders.find((s) => s !== null);
  //     if (existingSlider) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `Slider "${existingSlider.title}" already exists`,
  //       });
  //     }

  //     // Create new sliders with processed data
  //     const createdSliders = await Slider.insertMany(
  //       processedSliders.map((slider) => ({
  //         groupId: groupId,
  //         clientId: slider.clientId,
  //         title: capitalizeFirstLetter(slider.title),
  //         buttonUrl: slider.buttonUrl || "",
  //         description: slider.description || "",
  //         image: slider.image,
  //         status: slider.status !== undefined ? slider.status : true,
  //         createdBy: req.userId,
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       })),
  //       { session }
  //     );

  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Sliders ${Messages.CREATE_SUCCESS}`,
  //       data: createdSliders,
  //       groupId: groupId,
  //     });
  //   } catch (error: any) {
  //     // Handle transaction errors specifically
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }

  //     console.error("Error creating sliders:", error);

  //     // Handle duplicate key errors
  //     if (error.code === 11000) {
  //       return res.status(HttpStatusCodes.CONFLICT).json({
  //         message: "Duplicate slider detected",
  //         details: error.message,
  //       });
  //     }

  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //       error:
  //         process.env.NODE_ENV === "development" ? error.message : undefined,
  //     });
  //   } finally {
  //     if (session) {
  //       await session.endSession();
  //     }
  //   }
  // },

  async createSlider(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const sessionOptions = {
      defaultTransactionOptions: {
        maxTimeMS: 120000,
      },
    };
    const session = await mongoose.startSession(sessionOptions);

    try {
      // Generate a unique groupId for this batch
      const groupId = uuidv4();

      await session.withTransaction(async () => {
        // Debug logging
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        // Validate request contains sliders data
        if (!req.body.sliders) {
          // throw new Error("Sliders data is required");
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Sliders data is required",
          });
        }

        // Parse the JSON string from form data
        let sliders;
        try {
          sliders = JSON.parse(req.body.sliders);
          if (!Array.isArray(sliders)) {
            throw new Error("Sliders data must be an array");
          }
          if (sliders.length > 20) {
            throw new Error("Maximum 20 sliders per request");
          }
        } catch (error) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Invalid sliders data format",
          });
        }

        // Process files if they exist
        const files = (req.files as Express.Multer.File[]) || [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < sliders.length; i += BATCH_SIZE) {
          const batch = sliders.slice(i, i + BATCH_SIZE);
          await SliderServices.processSliderBatch(
            batch,
            files,
            groupId,
            req.userId,
            session
          );
        }
      });

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Sliders ${Messages.CREATE_SUCCESS}`,
        groupId: groupId,
      });
    } catch (error: any) {
      // Handle transaction errors specifically
      if (req.files?.length) {
        await SliderServices.cleanupUploadedFiles(
          req.files as Express.Multer.File[]
        );
      }

      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || `${ErrorMessages.SERVER_ERROR}`,
        suggestion: error.message
          ? undefined
          : "Try submitting fewer sliders at once",
      });
    } finally {
      await session.endSession();
    }
  },

  processSliderBatch: async (
    batch: any[],
    files: Express.Multer.File[],
    groupId: string,
    userId: string,
    session: ClientSession
  ) => {
    const processedSliders = batch.map((slider, index) => {
      const fileField = `sliders[${index}][image]`;
      const file = files.find((f) => f.fieldname === fileField);

      return {
        ...slider,
        groupId,
        image: file ? file.filename : slider.image || null,
        title: capitalizeFirstLetter(slider.title),
        buttonUrl: slider.buttonUrl || "",
        description: slider.description || "",
        status: slider.status !== undefined ? slider.status : true,
        createdBy: userId,
        isDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const existingSliders = await Promise.all(
      processedSliders.map((slider) =>
        Slider.findOne(
          {
            clientId: slider.clientId,
            title: slider.title,
            isDelete: false,
          },
          null,
          { session }
        )
      )
    );

    const existingSlider = existingSliders.find((s) => s !== null);
    if (existingSlider) {
      throw new Error(`Slider "${existingSlider.title}" already exists`);
    }

    await Slider.insertMany(processedSliders, { session });

    await Promise.all(
      processedSliders.map(async (slider) => {
        if (!slider.image) return;
        const file = files.find((f) => f.filename === slider.image);
        if (file) {
          await SliderServices.finalizeFileUpload(file);
        }
      })
    );
  },

  finalizeFileUpload: async (file: Express.Multer.File) => {
    try {
      console.log(`File ${file.filename} successfully processed`);
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
      fs.unlinkSync(file.path);
      throw new Error(`Failed to process uploaded file`);
    }
  },

  cleanupUploadedFiles: async (files: Express.Multer.File[]) => {
    await Promise.all(
      files.map((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up file: ${file.filename}`);
          }
        } catch (cleanupError) {
          console.error(
            `Error cleaning up file ${file.filename}:`,
            cleanupError
          );
        }
      })
    );
  },

  async getAllSliders(req: Request, res: Response) {
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

      const hasSliderViewPermission =
        userPermissions.permissions.includes("SLIDER_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasSliderViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let sliders;

      if (isAdminOrSuperAdmin) {
        sliders = await Slider.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        sliders = await Slider.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      res.status(HttpStatusCodes.OK).json(sliders);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "sliders!"}`,
      });
    }
  },

  // Get Slider By ID
  async getSliderById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { sliderId } = req.params;
    try {
      const slider = await Slider.findOne({
        _id: sliderId,
        isDelete: false,
      }).select("-__v");

      if (!slider) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Slider ${ErrorMessages.NOT_FOUND}`,
        });
      }

      res.status(HttpStatusCodes.OK).json(slider);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "slider!"}`,
      });
    }
  },

  // Update Slider By ID
  // async updateSliderById(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const { sliderId } = req.params;
  //   const { sliders } = req.body;

  //   // Start a session for the transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Check if the slider exists
  //     const existingSlider = await Slider.findById(sliderId).session(session);
  //     if (!existingSlider) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.NOT_FOUND).json({
  //         message: `Slider ${ErrorMessages.NOT_FOUND}`,
  //       });
  //     }

  //     // Update the slider details
  //     const updatedSlider = await Slider.findByIdAndUpdate(
  //       sliderId,
  //       {
  //         clientId: sliders[0].clientId || existingSlider.clientId,
  //         title: sliders[0].title
  //           ? capitalizeFirstLetter(sliders[0].title)
  //           : existingSlider.title,
  //         buttonUrl: sliders[0].buttonUrl || existingSlider.buttonUrl,
  //         description: sliders[0].description || existingSlider.description,
  //         image: sliders[0].image || existingSlider.image,
  //         status: sliders[0].status || existingSlider.status,
  //         updatedBy: req.userId,
  //         updatedAt: new Date(),
  //       },
  //       { new: true, session }
  //     ).select("-__v");

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `Slider ${Messages.UPDATE_SUCCESS}`,
  //       data: updatedSlider,
  //     });
  //   } catch (error) {
  //     // Rollback the transaction on error
  //     await session.abortTransaction();
  //     console.error("Error updating slider:", error);
  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //     });
  //   } finally {
  //     session.endSession(); // Ensures session cleanup
  //   }
  // },

  async updateSliderById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { sliderId } = req.params;

      // Debug logging
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      // Validate request contains sliders data
      if (!req.body.sliders) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Sliders data is required",
        });
      }

      // Parse the JSON string from form data
      let sliders;
      try {
        sliders = JSON.parse(req.body.sliders);
        if (!Array.isArray(sliders) || sliders.length === 0) {
          throw new Error("Sliders data must be a non-empty array");
        }
      } catch (error) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Invalid sliders data format",
        });
      }

      // Check if the slider exists
      const existingSlider = await Slider.findById(sliderId).session(session);
      if (!existingSlider) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Slider ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Process files if they exist
      const files = (req.files as Express.Multer.File[]) || [];
      const fileField = `sliders[0][image]`; // For single slider update
      const file = files.find((f) => f.fieldname === fileField);

      // Prepare update data
      const updateData = {
        clientId: sliders[0].clientId || existingSlider.clientId,
        title: sliders[0].title
          ? capitalizeFirstLetter(sliders[0].title)
          : existingSlider.title,
        buttonUrl: sliders[0].buttonUrl || existingSlider.buttonUrl,
        description: sliders[0].description || existingSlider.description,
        // Use new file if uploaded, otherwise keep existing or use provided URL
        image: file ? file.filename : sliders[0].image || existingSlider.image,
        status:
          sliders[0].status !== undefined
            ? sliders[0].status
            : existingSlider.status,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      // Update the slider
      const updatedSlider = await Slider.findByIdAndUpdate(
        sliderId,
        updateData,
        { new: true, session }
      );

      // If we're updating with a new file, delete the old one
      if (file && existingSlider.image) {
        try {
          const filePath = path.join(
            __dirname,
            `../uploads/slider/${existingSlider.image}`
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting old image file:", err);
          // Don't fail the request if file deletion fails
        }
      }

      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Slider ${Messages.UPDATE_SUCCESS}`,
        data: updatedSlider,
      });
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      console.error("Error updating slider:", error);

      if (error.code === 11000) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          message: "Duplicate slider detected",
          details: error.message,
        });
      }

      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.SERVER_ERROR}`,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  },

  // Soft Delete Slider By ID
  async softDeleteSliderById(req: Request, res: Response) {
    const { sliderId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the slider and mark it as deleted (soft delete)
      const updatedSlider = await Slider.findByIdAndUpdate(
        sliderId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedSlider) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Slider ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Slider ${Messages.MARKED_AS_DELETED}`,
        data: updatedSlider,
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.SERVER_ERROR}`,
      });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  // Activate Slider By ID
  async activateSliderById(req: Request, res: Response) {
    const { sliderId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the slider and mark it as active (undo soft delete)
      const updatedSlider = await Slider.findByIdAndUpdate(
        sliderId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedSlider) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Slider ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Slider ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedSlider,
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.SERVER_ERROR}`,
      });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  // Delete Slider By ID (Permanent Delete)
  // async deleteSliderById(req: Request, res: Response) {
  //   const { sliderId } = req.params;

  //   // Start a session for the transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Find and delete the slider
  //     const deletedSlider = await Slider.findOneAndDelete(
  //       { _id: sliderId, isDelete: true },
  //       { session }
  //     );

  //     if (!deletedSlider) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.NOT_FOUND).json({
  //         message: `Slider ${ErrorMessages.NOT_FOUND}`,
  //       });
  //     }

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `Slider ${Messages.DELETE_SUCCESS}`,
  //       data: deletedSlider,
  //     });
  //   } catch (error) {
  //     // Rollback the transaction on error
  //     await session.abortTransaction();
  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: `${ErrorMessages.SERVER_ERROR}`,
  //     });
  //   } finally {
  //     session.endSession(); // Ensures session cleanup
  //   }
  // },

  async deleteSliderById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { sliderId } = req.params;
      const slider = await Slider.findOneAndDelete(
        { _id: sliderId, isDelete: true },
        { session }
      );

      if (!slider) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (slider.image && slider.image.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("slider", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(slider.image);
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Slider ${Messages.DELETE_SUCCESS}`,
        data: slider,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting slider:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
