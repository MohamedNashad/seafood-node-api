import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import Permission from "../models/permission";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import { PERMISSION_TYPES } from "../constants/model_constants";
import RolePermission from "../models/role_permission";
import mongoose from "mongoose";
import { getUserRolesAndPermissions } from "../utils/auth_utils";

export const PermissionServices = {
  // create
  async createPermission(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes?.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { code, name, type, description } = req.body;
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingPermission = await Permission.findOne(
        {
          $or: [
            { code: convertToUnderscoreUpperCase(code) },
            { name: capitalizeFirstLetter(name) },
          ],
          isDelete: false,
        },
        null,
        { session }
      );

      console.log(existingPermission, "---REQ");

      if (existingPermission) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes?.BAD_REQUEST)
          .json({ message: `Permission ${ErrorMessages?.ALREADY_EXISTS}` });
      }

      // Ensure the 'type' is a valid value from PERMISSION_TYPES
      if (
        type &&
        !PERMISSION_TYPES.includes(convertToUnderscoreUpperCase(type))
      ) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Invalid permission type value: ${type}` });
      }
      // Create a new permission
      const permission = new Permission({
        code: convertToUnderscoreUpperCase(code),
        name: capitalizeFirstLetter(name),
        type: convertToUnderscoreUpperCase(type),
        description: description,
        createdBy: req.userId,
      });

      await permission.save({ session });
      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Permission ${Messages.CREATE_SUCCESS}`,
        data: permission,
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await session.abortTransaction();
      return res
        .status(HttpStatusCodes?.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages?.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async getAllPermissions(req: Request, res: Response) {
    try {
      // check the role and permissions
      const { userId } = req; // Assuming userId is in the request

      const [userPermissions] = await Promise.all([
        getUserRolesAndPermissions(userId.toString()), // Convert to string
      ]);

      console.log(userPermissions, "-------userPermissions");
      // Check permissions
      const isAdminOrSuperAdmin = userPermissions.roles.some((role) =>
        ["SUPER_ADMIN", "ADMIN"].includes(role)
      );

      const hasPermissionViewPermission =
        userPermissions.permissions.includes("PERMISSION_VIEW");

      // Authorization
      if (!hasPermissionViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let permissions;
      if (isAdminOrSuperAdmin) {
        permissions = await Permission.find()
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else {
        res.status(HttpStatusCodes.OK).json({});
      }
      res.status(HttpStatusCodes.OK).json(permissions);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "permissions!"}`,
      });
    }
  },

  async getPermissionById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const id = req.params.permissionId.toString();
    try {
      const permission = await Permission.findOne({
        _id: id,
      }).select("-__v");
      res.json(permission);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "permissionId!"}`,
      });
    }
  },

  // UPDATE
  async updatePermissionById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const { permissionId } = req.params;
    const { code, name, type, description } = req.body;

    try {
      // Check if the permission exists in the database
      const existingPermission = await Permission.findById(
        permissionId
      ).session(session);
      if (!existingPermission) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Permission ${ErrorMessages.NOT_FOUND}`,
        });
      }

      // Check for unique fields (code and name) if they are being updated
      if (name || code) {
        const conditions = [];

        if (name) {
          conditions.push({ name: capitalizeFirstLetter(name) });
        }
        if (code) {
          conditions.push({ code: convertToUnderscoreUpperCase(code) });
        }

        const duplicatePermission = await Permission.findOne(
          {
            _id: { $ne: permissionId }, // Exclude the current permission
            $or: conditions, // Ensured valid conditions only
            isDelete: false, // Ensure it's not a deleted permission
          },
          null,
          { session }
        );

        if (duplicatePermission) {
          const existingFields = [];
          if (duplicatePermission.name === capitalizeFirstLetter(name)) {
            existingFields.push("name");
          }
          if (duplicatePermission.code === convertToUnderscoreUpperCase(code)) {
            existingFields.push("code");
          }

          await session.abortTransaction();
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: `${
              ErrorMessages.FIELDS_ALREADY_EXISTS
            } for another permission: ${existingFields.join(", ")}`,
          });
        }
      }

      // Ensure the 'type' is a valid value from PERMISSION_TYPES
      if (
        type &&
        !PERMISSION_TYPES.includes(convertToUnderscoreUpperCase(type))
      ) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Invalid type value: ${type}` });
      }

      // Update the permission details
      const updatedData = {
        code: code
          ? convertToUnderscoreUpperCase(code)
          : existingPermission.code,
        name: name ? capitalizeFirstLetter(name) : existingPermission.name,
        type: type
          ? convertToUnderscoreUpperCase(type)
          : existingPermission.type,
        description: description || existingPermission.description,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      const updatedPermission = await Permission.findByIdAndUpdate(
        permissionId,
        updatedData,
        {
          new: true,
          session,
        }
      )
        .select("-__v")
        .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order;

      // Commit the transaction
      await session.commitTransaction();

      if (updatedPermission) {
        return res.status(HttpStatusCodes.OK).json({
          message: `Permission ${Messages.UPDATE_SUCCESS}`,
          data: updatedPermission,
        });
      }
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Error updating permission:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async softDeletePermissionById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { permissionId } = req.params;
      // Find the permission and mark it as deleted (soft delete)
      const updatedPermission = await Permission.findByIdAndUpdate(
        permissionId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedPermission) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Permission not found with ID: ${permissionId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Permission ${Messages.MARKED_AS_DELETED}`,
        data: updatedPermission,
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

  async activatePermissionById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { permissionId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedPermission = await Permission.findByIdAndUpdate(
        permissionId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedPermission) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Permission not found with ID: ${permissionId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Permission ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedPermission,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating permission:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Permission ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deletePermissionById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { permissionId } = req.params;
      // Check if the role has associated permissions in RolePermission model
      const rolePermissions = await RolePermission.exists({ permissionId });

      if (rolePermissions) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.CONFLICT).json({
          message: "Permission cannot be deleted as it has associated Roles!",
        });
      }

      const permission = await Permission.findOneAndDelete(
        { _id: permissionId, isDelete: true },
        { session }
      );

      if (!permission) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Commit the transaction after successful deletion
      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Permission ${Messages.DELETE_SUCCESS}`,
        data: permission,
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
