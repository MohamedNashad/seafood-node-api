import { Request, Response } from "express";
import Role from "../models/role";
import { HttpStatusCodes } from "../constants/http_status_codes";
import User from "../models/user";
import UserRole from "../models/user_role";

export const UserRoleServices = {
  // Assign Roles to User Controller
  async assignRolesToUser(req: Request, res: Response) {
    try {
      const { userId, roles } = req.body; // permissions is an array of permission IDs

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(HttpStatusCodes?.NOT_FOUND)
          .json({ message: "User not found" });
      }

      // Fetch current roles for the user
      const currentUserRoles = await UserRole.find({
        userId: user._id,
      }).select("roleId");

      const currentRoleIds = currentUserRoles.map((rp) => rp.roleId.toString());

      // Find permissions to remove (present in DB but not in the new permissions list)
      const rolesToRemove = currentRoleIds.filter(
        (roleId) => !roles.includes(roleId)
      );

      // Find permissions to add (present in the new list but not in the DB)
      const rolesToAdd = roles.filter(
        (roleId: string) => !currentRoleIds.includes(roleId)
      );

      // Remove permissions that are no longer part of the updated permission list
      if (rolesToRemove.length > 0) {
        await UserRole.deleteMany({
          userId: user._id,
          roleId: { $in: rolesToRemove },
        });
      }
      // Add new permissions that weren't previously assigned
      const assignedRoles = [];
      for (const roleId of rolesToAdd) {
        const role = await Role.findById(roleId);
        if (!role) {
          return res
            .status(HttpStatusCodes?.NOT_FOUND)
            .json({ message: `Role not found: ${roleId}` });
        }

        // Create and save new role-permission association
        const userRole = new UserRole({
          userId: user._id,
          roleId: role._id,
        });
        await userRole.save();
        assignedRoles.push(role);
      }

      return res.status(HttpStatusCodes?.OK).json({
        message: "Roles updated successfully",
        addedRoles: assignedRoles,
        removedRoles: rolesToRemove,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(HttpStatusCodes?.BAD_REQUEST).json({
          message: "Role is already assigned to the user",
        });
      }

      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error assigning roles", error });
    }
  },

  // Get Role with Permissions Controller
  async getUserWithRoles(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(HttpStatusCodes?.NOT_FOUND)
          .json({ message: "User not found" });
      }

      // Get the assigned permissions
      const userRoles = await UserRole.find({
        userId: user._id,
        isDelete: false,
      }).populate("roleId");

      const roles = userRoles.map((rp) => rp.roleId);

      const userDetails = {
        email: user.email,
        name: user.firstName + " " + user.lastName,
      };

      return res.status(200).json({
        user: userDetails, // email is unique so using it
        roles,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching role permissions", error });
    }
  },
};
