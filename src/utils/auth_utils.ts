import {
  UserRolesAndPermissions,
  DetailedRolePermission,
} from "../types/auth_types";
import UserRole from "../models/user_role";
import RolePermission from "../models/role_permission";
import { RoleType } from "../models/role";
import { PermissionType } from "../models/permission";
import { Types } from "mongoose";

// fetch logged in user role and permissions
export const getUserRolesAndPermissions = async (
  userId: string | Types.ObjectId
): Promise<UserRolesAndPermissions> => {
  try {
    const userIdStr = userId.toString(); // Convert to string once
    const userIdObj = new Types.ObjectId(userId); // For DB queries

    // Type guard functions
    const isRole = (role: any): role is RoleType => {
      return role && typeof role === "object" && "_id" in role;
    };

    const isPermission = (permission: any): permission is PermissionType => {
      return (
        permission && typeof permission === "object" && "code" in permission
      );
    };

    // Fetch user roles with populated role data
    const userRoles = await UserRole.find({ userId: userIdObj }).populate<{
      roleId: RoleType;
    }>("roleId");

    if (!userRoles.length) {
      return {
        userId: userIdStr,
        roles: [],
        permissions: [],
        detailedRolesAndPermissions: [],
      };
    }

    // Extract role IDs safely
    const roleIds = userRoles.map((userRole) =>
      isRole(userRole.roleId) ? userRole.roleId._id : userRole.roleId
    );

    // Fetch permissions for these roles
    const allRolePermissions = await RolePermission.find({
      roleId: { $in: roleIds },
    }).populate<{ permissionId: PermissionType }>("permissionId");

    // Process roles
    const roles = [
      ...new Set(
        userRoles
          .map((userRole) =>
            isRole(userRole.roleId) ? userRole.roleId.slug : ""
          )
          .filter((slug): slug is string => Boolean(slug))
      ),
    ];

    // Process permissions
    const permissions = [
      ...new Set(
        allRolePermissions
          .map((rp) =>
            isPermission(rp.permissionId) ? rp.permissionId.code : ""
          )
          .filter((code): code is string => Boolean(code))
      ),
    ];

    // Create detailed mapping
    const detailedRolesAndPermissions = userRoles
      .map((userRole) => {
        const role = userRole.roleId;
        if (!isRole(role)) return null;

        const permissionsForRole = allRolePermissions
          .filter(
            (rp) =>
              isRole(rp.roleId) &&
              rp.roleId._id.toString() === role._id.toString()
          )
          .map((rp) =>
            isPermission(rp.permissionId) ? rp.permissionId.code : ""
          )
          .filter((code): code is string => Boolean(code));

        return {
          roleName: role.slug,
          permissions: permissionsForRole,
        };
      })
      .filter((role): role is DetailedRolePermission => role !== null);

    return {
      userId: userIdStr,
      roles,
      permissions,
      detailedRolesAndPermissions,
    };
  } catch (error) {
    console.error("Error fetching user roles and permissions:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch permissions"
    );
  }
};

// check role and permissions
export const hasRoleWithPermissions = (
  userData: UserRolesAndPermissions | undefined,
  roles: string[],
  permissions: string[]
): boolean => {
  if (!userData) return false;

  // Check if user has at least one of the required roles
  const hasRequiredRole = roles.some((role) => userData.roles.includes(role));

  // Check if user has at least one of the required permissions
  const hasRequiredPermission = permissions.some((permission) =>
    userData.permissions.includes(permission)
  );

  return hasRequiredRole && hasRequiredPermission;
};
