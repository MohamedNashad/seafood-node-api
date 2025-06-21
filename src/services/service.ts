import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import { capitalizeFirstLetter } from "../utils/convert_text_utils";
import mongoose, { ClientSession } from "mongoose";
import Service from "../models/service";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { deleteFile } from "../utils/file_handler_utils";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";

export const ServiceServices = {
  // Create Service
  // async createService(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   // const { services } = req.body;

  //   // Start a session for transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Debug logging
  //     console.log("Request body:", req.body);
  //     console.log("Request files:", req.files);

  //     // Validate request contains services data
  //     if (!req.body.services) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Services data is required",
  //       });
  //     }

  //     // Parse the JSON string from form data
  //     let services;
  //     try {
  //       services = JSON.parse(req.body.services);
  //       if (!Array.isArray(services)) {
  //         throw new Error("Services data must be an array");
  //       }
  //     } catch (error) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Invalid services data format",
  //       });
  //     }

  //     // Generate a unique groupId for this batch
  //     const groupId = uuidv4();

  //     // Process files if they exist
  //     const files = (req.files as Express.Multer.File[]) || [];
  //     const processedServices = services.map((service: any, index: number) => {
  //       const fileField = `services[${index}][image]`;
  //       const file = files.find((f) => f.fieldname === fileField);

  //       return {
  //         ...service,
  //         groupId: groupId,
  //         image: file ? `${file.filename}` : service.image,
  //         // Set other required fields
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       };
  //     });
  //     // Check for existing services
  //     const existingServices = await Promise.all(
  //       processedServices.map(async (service: any) => {
  //         return await Service.findOne(
  //           {
  //             clientId: service.clientId,
  //             title: capitalizeFirstLetter(service.title),
  //             isDelete: false,
  //           },
  //           null,
  //           { session }
  //         );
  //       })
  //     );

  //     const existingService = existingServices.find((s) => s !== null);
  //     if (existingService) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `Service "${existingService.title}" already exists`,
  //       });
  //     }

  //     // Create new services with processed data
  //     const createdServices = await Service.insertMany(
  //       processedServices.map((service) => ({
  //         groupId: groupId,
  //         clientId: service.clientId,
  //         title: capitalizeFirstLetter(service.title),
  //         buttonUrl: service.buttonUrl || "",
  //         description: service.description || "",
  //         image: service.image,
  //         status: service.status !== undefined ? service.status : true,
  //         createdBy: req.userId,
  //         isDelete: false,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       })),
  //       { session }
  //     );

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Services ${Messages.CREATE_SUCCESS}`,
  //       data: createdServices,
  //       groupId: groupId,
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
  // async createService(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   // Configure session with longer timeout
  //   const sessionOptions = {
  //     defaultTransactionOptions: {
  //       maxTimeMS: 120000, // 2 minute timeout
  //     },
  //   };
  //   const session = await mongoose.startSession(sessionOptions);

  //   try {
  //     const groupId = uuidv4();

  //     await session.withTransaction(async () => {
  //       console.log("Request body:", req.body);
  //       console.log("Request files:", req.files);

  //       if (!req.body.services) {
  //         throw new Error("Services data is required");
  //       }

  //       // Parse services
  //       let services;

  //       try {
  //         services = JSON.parse(req.body.services);
  //         if (!Array.isArray(services)) {
  //           throw new Error("Services data must be an array");
  //         }
  //         if (services.length > 20) {
  //           throw new Error("Maximum 20 services per request");
  //         }
  //       } catch (error: any) {
  //         throw new Error(`Invalid services data: ${error.message}`);
  //       }

  //       const files = (req.files as Express.Multer.File[]) || [];

  //       // Process in batches of 5
  //       const BATCH_SIZE = 5;
  //       for (let i = 0; i < services.length; i += BATCH_SIZE) {
  //         const batch = services.slice(i, i + BATCH_SIZE);
  //         await this.processServiceBatch(
  //           batch,
  //           files,
  //           groupId,
  //           req.userId,
  //           session
  //         );
  //       }
  //     });

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Services ${Messages.CREATE_SUCCESS}`,
  //       groupId: groupId,
  //     });
  //   } catch (error: any) {
  //     console.error("Service creation error:", error);

  //     // Cleanup uploaded files if transaction fails
  //     if (req.files?.length) {
  //       await this.cleanupUploadedFiles(req.files as Express.Multer.File[]);
  //     }

  //     return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
  //       message: error.message || `${ErrorMessages.SERVER_ERROR}`,
  //       suggestion: error.message
  //         ? undefined
  //         : "Try submitting fewer services at once",
  //     });
  //   } finally {
  //     await session.endSession();
  //   }
  // },

  // async processServiceBatch(
  //   batch: any[],
  //   files: Express.Multer.File[],
  //   groupId: string,
  //   userId: string,
  //   session: ClientSession
  // ) {
  //   // 1. Process services data
  //   const processedServices = batch.map((service, index) => {
  //     const fileField = `services[${index}][image]`;
  //     const file = files.find((f) => f.fieldname === fileField);

  //     return {
  //       ...service,
  //       groupId,
  //       image: file ? file.filename : service.image || null,
  //       title: capitalizeFirstLetter(service.title),
  //       buttonUrl: service.buttonUrl || "",
  //       description: service.description || "",
  //       status: service.status !== undefined ? service.status : true,
  //       createdBy: userId,
  //       isDelete: false,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     };
  //   });

  //   // 2. Check for existing services
  //   const existingServices = await Promise.all(
  //     processedServices.map((service) =>
  //       Service.findOne(
  //         {
  //           clientId: service.clientId,
  //           title: service.title,
  //           isDelete: false,
  //         },
  //         null,
  //         { session }
  //       )
  //     )
  //   );

  //   const existingService = existingServices.find((s) => s !== null);
  //   if (existingService) {
  //     throw new Error(`Service "${existingService.title}" already exists`);
  //   }

  //   // 3. Save to database
  //   await Service.insertMany(processedServices, { session });

  //   // 4. Only keep files if DB save succeeded
  //   await Promise.all(
  //     processedServices.map(async (service) => {
  //       if (!service.image) return;
  //       const file = files.find((f) => f.filename === service.image);
  //       if (file) {
  //         await this.finalizeFileUpload(file);
  //       }
  //     })
  //   );
  // },

  // async finalizeFileUpload(file: Express.Multer.File) {
  //   // Implement any post-processing needed for the file
  //   // Example: Move from temp location to permanent storage
  //   // This is just a placeholder - adjust based on your storage system
  //   try {
  //     // fs.renameSync(file.path, `/permanent/uploads/${file.filename}`);
  //     console.log(`File ${file.filename} successfully processed`);
  //   } catch (error) {
  //     console.error(`Error processing file ${file.filename}:`, error);
  //     // Clean up failed file
  //     fs.unlinkSync(file.path);
  //     throw new Error(`Failed to process uploaded file`);
  //   }
  // },

  // async cleanupUploadedFiles(files: Express.Multer.File[]) {
  //   await Promise.all(
  //     files.map((file) => {
  //       try {
  //         if (fs.existsSync(file.path)) {
  //           fs.unlinkSync(file.path);
  //           console.log(`Cleaned up file: ${file.filename}`);
  //         }
  //       } catch (cleanupError) {
  //         console.error(
  //           `Error cleaning up file ${file.filename}:`,
  //           cleanupError
  //         );
  //       }
  //     })
  //   );
  // },

  createService: async (req: Request, res: Response) => {
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
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        if (!req.body.services) {
          // throw new Error("Services data is required");
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Services data is required",
          });
        }

        let services;
        try {
          services = JSON.parse(req.body.services);
          if (!Array.isArray(services)) {
            throw new Error("Services data must be an array");
          }
          if (services.length > 20) {
            throw new Error("Maximum 20 services per request");
          }
        } catch (error: any) {
          // throw new Error(`Invalid services data: ${error.message}`);
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Invalid services data format",
          });
        }

        const files = (req.files as Express.Multer.File[]) || [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < services.length; i += BATCH_SIZE) {
          const batch = services.slice(i, i + BATCH_SIZE);
          await ServiceServices.processServiceBatch(
            batch,
            files,
            groupId,
            req.userId,
            session
          );
        }
      });

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Services ${Messages.CREATE_SUCCESS}`,
        groupId: groupId,
      });
    } catch (error: any) {
      console.error("Service creation error:", error);

      if (req.files?.length) {
        await ServiceServices.cleanupUploadedFiles(
          req.files as Express.Multer.File[]
        );
      }

      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || `${ErrorMessages.SERVER_ERROR}`,
        suggestion: error.message
          ? undefined
          : "Try submitting fewer services at once",
      });
    } finally {
      await session.endSession();
    }
  },

  processServiceBatch: async (
    batch: any[],
    files: Express.Multer.File[],
    groupId: string,
    userId: string,
    session: ClientSession
  ) => {
    const processedServices = batch.map((service, index) => {
      const fileField = `services[${index}][image]`;
      const file = files.find((f) => f.fieldname === fileField);

      return {
        ...service,
        groupId,
        image: file ? file.filename : service.image || null,
        title: capitalizeFirstLetter(service.title),
        buttonUrl: service.buttonUrl || "",
        description: service.description || "",
        status: service.status !== undefined ? service.status : true,
        createdBy: userId,
        isDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const existingServices = await Promise.all(
      processedServices.map((service) =>
        Service.findOne(
          {
            clientId: service.clientId,
            title: service.title,
            isDelete: false,
          },
          null,
          { session }
        )
      )
    );

    const existingService = existingServices.find((s) => s !== null);
    if (existingService) {
      throw new Error(`Service "${existingService.title}" already exists`);
    }

    await Service.insertMany(processedServices, { session });

    await Promise.all(
      processedServices.map(async (service) => {
        if (!service.image) return;
        const file = files.find((f) => f.filename === service.image);
        if (file) {
          await ServiceServices.finalizeFileUpload(file);
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

  // Get All Services
  async getAllServices(req: Request, res: Response) {
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

      const hasServiceViewPermission =
        userPermissions.permissions.includes("SLIDER_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasServiceViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let services;
      if (isAdminOrSuperAdmin) {
        services = await Service.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        services = await Service.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      res.status(HttpStatusCodes.OK).json(services);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "services!"}`,
      });
    }
  },

  // Get service By ID
  async getServiceById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { serviceId } = req.params;
    try {
      const service = await Service.findOne({
        _id: serviceId,
        isDelete: false,
      }).select("-__v");

      if (!service) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Service ${ErrorMessages.NOT_FOUND}`,
        });
      }

      res.status(HttpStatusCodes.OK).json(service);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "service!"}`,
      });
    }
  },

  // Update service By ID
  async updateServiceById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const { serviceId } = req.params;

    try {
      // Debug logging
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      // Validate request contains services data
      if (!req.body.services) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Services data is required",
        });
      }

      // Parse the JSON string from form data
      let services;

      try {
        services = JSON.parse(req.body.services);
        if (!Array.isArray(services) || services.length === 0) {
          throw new Error("Services data must be a non-empty array");
        }
      } catch (error) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Invalid services data format",
        });
      }

      // Check if the service exists
      const existingService = await Service.findById(serviceId).session(
        session
      );
      if (!existingService) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Service ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Process files if they exist
      const files = (req.files as Express.Multer.File[]) || [];
      const fileField = `services[0][image]`; // For single service update
      const file = files.find((f) => f.fieldname === fileField);

      // Prepare update data
      const updateData = {
        clientId: services[0].clientId || existingService.clientId,
        title: services[0].title
          ? capitalizeFirstLetter(services[0].title)
          : existingService.title,
        buttonUrl: services[0].buttonUrl || existingService.buttonUrl,
        description: services[0].description || existingService.description,
        // Use new file if uploaded, otherwise keep existing or use provided URL
        image: file
          ? file.filename
          : services[0].image || existingService.image,
        status:
          services[0].status !== undefined
            ? services[0].status
            : existingService.status,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      // Update the service
      const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        updateData,
        { new: true, session }
      );

      // If we're updating with a new file, delete the old one
      if (file && existingService.image) {
        try {
          const filePath = path.join(
            __dirname,
            `../uploads/service/${existingService.image}`
          );
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting old image file:", err);
          // Don't fail the request if file deletion fails
        }
      }
      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Service ${Messages.UPDATE_SUCCESS}`,
        data: updatedService,
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Error updating service:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.SERVER_ERROR}`,
      });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  // Soft Delete Service By ID
  async softDeleteServiceById(req: Request, res: Response) {
    const { serviceId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the service and mark it as deleted (soft delete)
      const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedService) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Service ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Service ${Messages.MARKED_AS_DELETED}`,
        data: updatedService,
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

  // Activate service By ID
  async activateServiceById(req: Request, res: Response) {
    const { serviceId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the service and mark it as active (undo soft delete)
      const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedService) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Service ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Service ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedService,
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

  // Delete service By ID (Permanent Delete)
  async deleteServiceById(req: Request, res: Response) {
    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { serviceId } = req.params;

      const service = await Service.findOneAndDelete(
        { _id: serviceId, isDelete: true },
        { session }
      );

      if (!service) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (service.image && service.image.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("service", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(service.image);
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Service ${Messages.DELETE_SUCCESS}`,
        data: service,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting service:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
