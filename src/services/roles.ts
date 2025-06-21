import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import Role from "../models/role";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import RolePermission from "../models/role_permission";
import { USER_TYPES } from "../constants/model_constants";
import UserRole from "../models/user_role";
import mongoose from "mongoose";
import { getUserRolesAndPermissions } from "../utils/auth_utils";

export const RoleServices = {
  async createRole(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const {
      slug,
      name,
      description,
      // permissions
    } = req.body;

    // rank calculation
    try {
      const maxRankResult = await Role.findOne()
        .sort({ rank: -1 })
        .select("rank")
        .lean();
      const maxRank = maxRankResult?.rank || 0;
      const newRank = maxRank + 1;

      // Check if the role already exists
      let existingRole = await Role.findOne({
        slug: convertToUnderscoreUpperCase(slug),
      });

      if (existingRole) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Role ${ErrorMessages?.ALREADY_EXISTS}` });
      }

      // Ensure the 'user type' is a valid value from USER_TYPES
      if (slug && !USER_TYPES.includes(convertToUnderscoreUpperCase(slug))) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Invalid user slug value: ${slug}` });
      }

      // Create the role
      const role = new Role({
        slug: convertToUnderscoreUpperCase(slug),
        name: capitalizeFirstLetter(name),
        rank: newRank,
        description: description,
        createdBy: req.userId,
      });

      await role.save(); // Save the role before assigning permissions

      return res.status(HttpStatusCodes.CREATED).json({
        message: `Role ${Messages.CREATE_SUCCESS}`,
        data: role,
      });
    } catch (error) {
      console.error("Error creating role:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    }
  },

  async getAuthorizedRoles(req: Request, res: Response) {
    try {
      const roles = await Role.find({ createdBy: req.userId })
        .select("-__v")
        .sort({ updatedAt: -1 })
        .populate([
          {
            path: "createdBy", // Populate createdBy field
            select: "_id firstName lastName", // Select only _id, firstName, lastName
          },
          {
            path: "updatedBy", // Populate updatedBy field
            select: "_id firstName lastName", // Select only _id, firstName, lastName
          },
        ]);
      res.status(HttpStatusCodes.OK).json(roles);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "roles!"}`,
      });
    }
  },

  async getAllRolesWithoutAuth(req: Request, res: Response) {
    try {
      let roles = await Role.find().select("-__v").sort({ updatedAt: -1 });
      res.status(HttpStatusCodes.OK).json(roles);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "roles!"}`,
      });
    }
  },

  async getAllRoles(req: Request, res: Response) {
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
        userPermissions.permissions.includes("ROLE_VIEW");

      // Authorization
      if (!hasPermissionViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let roles;
      if (isAdminOrSuperAdmin) {
        roles = await Role.find().select("-__v").sort({ updatedAt: -1 });
      } else {
        res.status(HttpStatusCodes.OK).json({});
      }
      res.status(HttpStatusCodes.OK).json(roles);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "roles!"}`,
      });
    }
  },

  async getRoleById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const id = req.params.roleId.toString();
    try {
      const role = await Role.findOne({
        _id: id,
      }).select("-__v");
      res.json(role);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "role!"}`,
      });
    }
  },

  async updateRoleById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const { roleId } = req.params;
    const { slug, name, description } = req.body;

    try {
      // Check if the permission exists in the database
      let existingRole = await Role.findById(roleId).session(session);
      if (!existingRole) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: `Role ${ErrorMessages.NOT_FOUND}` });
      }

      // Check for unique fields (slug and name) if they are being updated
      if (slug || name) {
        const conditions = [];
        if (name) {
          conditions.push({ name: capitalizeFirstLetter(name) });
        }
        if (slug) {
          conditions.push({ slug: convertToUnderscoreUpperCase(slug) });
        }
        // Check if the new slug or name already exists in the database for other records
        const duplicateRole = await Role.findOne({
          _id: { $ne: roleId }, // Excluding the current permission being updated
          $or: conditions, // Ensured valid conditions only
        });

        if (duplicateRole) {
          const existingFields = [];
          if (duplicateRole.slug === convertToUnderscoreUpperCase(slug))
            existingFields.push("slug");
          if (duplicateRole.name === capitalizeFirstLetter(name))
            existingFields.push("name");

          await session.abortTransaction();
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: `${
              ErrorMessages.FIELDS_ALREADY_EXISTS
            } for another role: ${existingFields.join(", ")}`,
          });
        }
      }

      // Ensure the 'slug' is a valid value from PERMISSION_TYPES
      if (slug && !USER_TYPES.includes(convertToUnderscoreUpperCase(slug))) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `Invalid slug value: ${slug}` });
      }

      // Update the permission details
      const updatedData = {
        slug: slug ? convertToUnderscoreUpperCase(slug) : existingRole.slug,
        name: name ? capitalizeFirstLetter(name) : existingRole.name,
        description: description ? description : existingRole.description,
        updatedBy: req.userId,
        updatedAt: new Date(),
      };

      const updatedRole = await Role.findByIdAndUpdate(roleId, updatedData, {
        new: true,
        session,
      })
        .select("-__v")
        .sort({ updatedAt: -1 });

      // Commit the transaction
      await session.commitTransaction();

      if (updatedRole) {
        return res.status(HttpStatusCodes.OK).json({
          message: `Role ${Messages.UPDATE_SUCCESS}`,
          data: updatedRole,
        });
      }
    } catch (error) {
      await session.abortTransaction();
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async softDeleteRoleById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { roleId } = req.params;
      // Find the permission and mark it as deleted (soft delete)
      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedRole) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Role not found with ID: ${roleId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Role ${Messages.MARKED_AS_DELETED}`,
        data: updatedRole,
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

  async activateRoleById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { roleId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedRole) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Role not found with ID: ${roleId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Role ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedRole,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating role:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Role ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deleteRoleById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { roleId } = req.params;

      // Check if the role has associated permissions in RolePermission model
      const rolePermissions = await RolePermission.findOne({ roleId });
      const userRoles = await UserRole.findOne({ roleId });

      if (rolePermissions) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          message: "Role cannot be deleted as it has associated Permissions!",
        });
      } else if (userRoles) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          message: "Role cannot be deleted as it has associated Users!",
        });
      }

      const role = await Role.findOneAndDelete(
        {
          _id: roleId,
          isDelete: true,
        },
        { session }
      );

      if (!role) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Role ${Messages.DELETE_SUCCESS}`,
        data: role,
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
