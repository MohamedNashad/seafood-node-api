import { Request, Response } from "express";
import Role from "../models/role";
import Permission from "../models/permission";
import RolePermission from "../models/role_permission";
import { HttpStatusCodes } from "../constants/http_status_codes";

export const RolePermissionServices = {
  // Assign Permissions to Role Controller
  async assignPermissionsToRole(req: Request, res: Response) {
    try {
      const { roleId, permissions } = req.body; // permissions is an array of permission IDs

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res
          .status(HttpStatusCodes?.NOT_FOUND)
          .json({ message: "Role not found" });
      }

      // Fetch current permissions for the role
      const currentRolePermissions = await RolePermission.find({
        roleId: role._id,
      }).select("permissionId");

      const currentPermissionIds = currentRolePermissions.map((rp) =>
        rp.permissionId.toString()
      );

      // Find permissions to remove (present in DB but not in the new permissions list)
      const permissionsToRemove = currentPermissionIds.filter(
        (permissionId) => !permissions.includes(permissionId)
      );

      // Find permissions to add (present in the new list but not in the DB)
      const permissionsToAdd = permissions.filter(
        (permissionId: string) => !currentPermissionIds.includes(permissionId)
      );

      // Remove permissions that are no longer part of the updated permission list
      if (permissionsToRemove.length > 0) {
        await RolePermission.deleteMany({
          roleId: role._id,
          permissionId: { $in: permissionsToRemove },
        });
      }

      // Add new permissions that weren't previously assigned
      const assignedPermissions = [];
      for (const permissionId of permissionsToAdd) {
        const permission = await Permission.findById(permissionId);
        if (!permission) {
          return res
            .status(HttpStatusCodes?.NOT_FOUND)
            .json({ message: `Permission not found: ${permissionId}` });
        }

        // Create and save new role-permission association
        const rolePermission = new RolePermission({
          roleId: role._id,
          permissionId: permission._id,
        });
        await rolePermission.save();
        assignedPermissions.push(permission);
      }

      return res.status(HttpStatusCodes?.OK).json({
        message: "Permissions updated successfully",
        addedPermissions: assignedPermissions,
        removedPermissions: permissionsToRemove,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(HttpStatusCodes?.BAD_REQUEST).json({
          message: "Permission is already assigned to the role",
        });
      }

      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Error assigning permissions", error });
    }
  },

  // Get Role with Permissions Controller
  async getRoleWithPermissions(req: Request, res: Response) {
    try {
      const { roleId } = req.params;

      // Find the role
      const role = await Role.findById(roleId);
      if (!role) {
        return res
          .status(HttpStatusCodes?.NOT_FOUND)
          .json({ message: "Role not found" });
      }

      // Get the assigned permissions
      const rolePermissions = await RolePermission.find({
        roleId: role._id,
        isDelete: false,
      }).populate("permissionId");

      const permissions = rolePermissions.map((rp) => rp.permissionId);

      return res.status(200).json({
        role: role.name,
        permissions,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching role permissions", error });
    }
  },
};
