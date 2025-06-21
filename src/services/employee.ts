import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import { capitalizeFirstLetter } from "../utils/convert_text_utils";
import mongoose, { ClientSession } from "mongoose";
import Employee from "../models/employee";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { deleteFile } from "../utils/file_handler_utils";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";

export const EmployeeServices = {
  // Create Employee
  // async createEmployee(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   // Start a session for transaction
  //   const session = await mongoose.startSession();
  //   session.startTransaction();

  //   try {
  //     // Debug logging
  //     console.log("Request body:", req.body);
  //     console.log("Request files:", req.files);

  //     // Validate request contains employees data
  //     if (!req.body.employees) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Employees data is required",
  //       });
  //     }

  //     let employees;
  //     try {
  //       employees = JSON.parse(req.body.employees);
  //       if (!Array.isArray(employees)) {
  //         throw new Error("Employees data must be an array");
  //       }
  //     } catch (error) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: "Invalid employees data format",
  //       });
  //     }

  //     // Generate a unique groupId for this batch
  //     const groupId = uuidv4();

  //     // Process files if they exist
  //     const files = (req.files as Express.Multer.File[]) || [];

  //     const processedEmployees = employees.map(
  //       (employee: any, index: number) => {
  //         const fileField = `employees[${index}][image]`;
  //         const file = files.find((f) => f.fieldname === fileField);

  //         return {
  //           ...employee,
  //           groupId: groupId,
  //           image: file ? `${file.filename}` : employee.image,
  //           // Set other required fields
  //           isDelete: false,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         };
  //       }
  //     );

  //     // Check if any Employee already exists with the same clientId and title
  //     const existingEmployees = await Promise.all(
  //       processedEmployees.map(async (employee: any) => {
  //         return await Employee.findOne(
  //           {
  //             clientId: employee.clientId,
  //             title: capitalizeFirstLetter(employee.title),
  //             isDelete: false,
  //           },
  //           null,
  //           { session }
  //         );
  //       })
  //     );

  //     const existingEmployee = existingEmployees.find((s) => s !== null);
  //     if (existingEmployee) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //         message: `Employee "${existingEmployee.title}" already exists`,
  //       });
  //     }

  //     // Create new employees
  //     const createdEmployees = await Employee.insertMany(
  //       processedEmployees.map((employee) => ({
  //         groupId: groupId,
  //         clientId: employee.clientId,
  //         title: capitalizeFirstLetter(employee.title),
  //         linkUrl: employee.linkUrl || "",
  //         description: employee.description || "",
  //         image: employee.image,
  //         status: employee.status !== undefined ? employee.status : true,
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
  //       message: `Employee ${Messages.CREATE_SUCCESS}`,
  //       data: createdEmployees,
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

  async createEmployee(req: Request, res: Response) {
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
        // Validate request contains employees data
        if (!req.body.employees) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Employees data is required",
          });
        }

        let employees;
        try {
          employees = JSON.parse(req.body.employees);
          if (!Array.isArray(employees)) {
            throw new Error("Employees data must be an array");
          }
          if (employees.length > 20) {
            throw new Error("Maximum 20 employees per request");
          }
        } catch (error) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: "Invalid employees data format",
          });
        }

        // Process files if they exist
        const files = (req.files as Express.Multer.File[]) || [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
          const batch = employees.slice(i, i + BATCH_SIZE);
          await EmployeeServices.processEmployeeBatch(
            batch,
            files,
            groupId,
            req.userId,
            session
          );
        }
      });

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Employees ${Messages.CREATE_SUCCESS}`,
        groupId: groupId,
      });
    } catch (error: any) {
      if (req.files?.length) {
        await EmployeeServices.cleanupUploadedFiles(
          req.files as Express.Multer.File[]
        );
      }

      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message || `${ErrorMessages.SERVER_ERROR}`,
        suggestion: error.message
          ? undefined
          : "Try submitting fewer employees at once",
      });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  processEmployeeBatch: async (
    batch: any[],
    files: Express.Multer.File[],
    groupId: string,
    userId: string,
    session: ClientSession
  ) => {
    const processedEmployees = batch.map((employee, index) => {
      const fileField = `employees[${index}][image]`;
      const file = files.find((f) => f.fieldname === fileField);

      return {
        ...employee,
        groupId,
        image: file ? file.filename : employee.image || null,
        title: capitalizeFirstLetter(employee.title),
        linkUrl: employee.linkUrl || "",
        description: employee.description || "",
        status: employee.status !== undefined ? employee.status : true,
        createdBy: userId,
        isDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const existingEmployees = await Promise.all(
      processedEmployees.map((employee) =>
        Employee.findOne(
          {
            clientId: employee.clientId,
            title: employee.title,
            isDelete: false,
          },
          null,
          { session }
        )
      )
    );

    const existingEmployee = existingEmployees.find((s) => s !== null);
    if (existingEmployee) {
      throw new Error(`Employee "${existingEmployee.title}" already exists`);
    }

    await Employee.insertMany(processedEmployees, { session });

    await Promise.all(
      processedEmployees.map(async (service) => {
        if (!service.image) return;
        const file = files.find((f) => f.filename === service.image);
        if (file) {
          await EmployeeServices.finalizeFileUpload(file);
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
  // Get All Employees
  async getAllEmployees(req: Request, res: Response) {
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

      const hasEmployeeViewPermission =
        userPermissions.permissions.includes("EMPLOYEE_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasEmployeeViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let employees;

      if (isAdminOrSuperAdmin) {
        employees = await Employee.find()
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        employees = await Employee.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 });
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      res.status(HttpStatusCodes.OK).json(employees);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "employees!"}`,
      });
    }
  },

  // Get EMployee By ID
  async getEmployeeById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { employeeId } = req.params;
    try {
      const employee = await Employee.findOne({
        _id: employeeId,
        isDelete: false,
      }).select("-__v");

      if (!employee) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Employee ${ErrorMessages.NOT_FOUND}`,
        });
      }

      res.status(HttpStatusCodes.OK).json(employee);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "employee!"}`,
      });
    }
  },

  // Update Employee By ID
  async updateEmployeeById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { employeeId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Debug logging
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      // Validate request contains employees data
      if (!req.body.employees) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Emplopyees data is required",
        });
      }

      // Parse the JSON string from form data
      let employees;

      try {
        employees = JSON.parse(req.body.employees);
        if (!Array.isArray(employees) || employees.length === 0) {
          throw new Error("Employees data must be a non-empty array");
        }
      } catch (error) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: "Invalid employees data format",
        });
      }

      // Check if the Employee exists
      const existingEmployee = await Employee.findById(employeeId).session(
        session
      );
      if (!existingEmployee) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Employee ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Process files if they exist
      const files = (req.files as Express.Multer.File[]) || [];
      const fileField = `employees[0][image]`; // For single employee update
      const file = files.find((f) => f.fieldname === fileField);

      const updateData = {
        clientId: employees[0].clientId || existingEmployee.clientId,
        title: employees[0].title
          ? capitalizeFirstLetter(employees[0].title)
          : existingEmployee.title,
        linkUrl: employees[0].linkUrl || existingEmployee.linkUrl,
        description: employees[0].description || existingEmployee.description,
        // Use new file if uploaded, otherwise keep existing or use provided URL
        image: file
          ? file.filename
          : employees[0].image || existingEmployee.image,
        status:
          employees[0].status !== undefined
            ? employees[0].status
            : existingEmployee.status,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      // Update the empolyee
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        updateData,
        { new: true, session }
      );

      // If we're updating with a new file, delete the old one
      if (file && existingEmployee.image) {
        try {
          const filePath = path.join(
            __dirname,
            `../uploads/employee/${existingEmployee.image}`
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
        message: `Employee ${Messages.UPDATE_SUCCESS}`,
        data: updatedEmployee,
      });
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Error updating employee:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.SERVER_ERROR}`,
      });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  // Soft Delete Employee By ID
  async softDeleteEmployeeById(req: Request, res: Response) {
    const { employeeId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the Employee and mark it as deleted (soft delete)
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedEmployee) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Employee ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Employee ${Messages.MARKED_AS_DELETED}`,
        data: updatedEmployee,
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

  // Activate Employee By ID
  async activateEmployeeById(req: Request, res: Response) {
    const { employeeId } = req.params;

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the employee and mark it as active (undo soft delete)
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedEmployee) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Employee ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        message: `Employee ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedEmployee,
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

  // Delete Employee By ID (Permanent Delete)
  async deleteEmployeeById(req: Request, res: Response) {
    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { employeeId } = req.params;

      const employee = await Employee.findOneAndDelete(
        { _id: employeeId, isDelete: true },
        { session }
      );

      if (!employee) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (employee.image && employee.image.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("employee", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(employee.image);
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Employee ${Messages.DELETE_SUCCESS}`,
        data: employee,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting employee:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
