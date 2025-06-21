import { Request, Response } from "express";
// import RolePermission from "../models/role_permission";
// import UserRole from "../models/user_role";

// export const UserRoleAndPermissionServices = {
//   // Get Role with Permissions Controller
//   async getLoggedInUserRoleWithPermissions(req: Request, res: Response) {
//     try {
//       const { userId } = req;
//       // console.log("Retrieved userId from middleware:", userId);

//       // Fetch user roles
//       const userRoles = await UserRole.find({ userId }).populate("roleId");
//       console.log("User roles found:", userRoles);

//       if (!userRoles.length) {
//         // return res.status(404).json({ message: "No roles found for user." });
//         return res.status(200).json({ message: "No roles found for user." });
//       }

//       // Extract roleIds
//       const roleIds = userRoles.map((userRole: any) => userRole.roleId._id);

//       // Fetch permissions for the roles
//       const rolePermissions = await RolePermission.find({
//         roleId: { $in: roleIds },
//       }).populate("permissionId");
//       // console.log("Permissions for roles found:", rolePermissions);

//       const rolesWithPermissions = userRoles.map((userRole: any) => {
//         const role = userRole.roleId;
//         const permissions = rolePermissions
//           .filter((rp: any) => rp.roleId.equals(role._id))
//           .map((rp: any) => rp.permissionId.code);

//         return {
//           userId: userId,
//           roleName: role.slug,
//           permissions,
//         };
//       });

//       // console.log("Final response object:", rolesWithPermissions);

//       // Send the roles and permissions as response
//       return res.status(200).json(rolesWithPermissions);
//     } catch (error) {
//       console.error("Error fetching role permissions:", error);
//       return res.status(500).json({
//         message: "Error fetching role permissions",
//         error,
//       });
//     }
//   },
// };

import RolePermission from "../models/role_permission";
import UserRole from "../models/user_role";

// First, define your interfaces (put these in a types file if possible)
interface Permission {
  _id: string;
  code: string;
  // other permission fields...
}

interface Role {
  _id: string;
  slug: string;
  // other role fields...
}

interface UserRoleDocument extends Document {
  userId: string;
  roleId: Role | string; // string when not populated, Role when populated
}

interface RolePermissionDocument extends Document {
  roleId: string | Role;
  permissionId: string | Permission;
}

export const UserRoleAndPermissionServices = {
  // Get Role with Permissions Controller
  async getLoggedInUserRoleWithPermissions(req: Request, res: Response) {
    try {
      const { userId } = req;

      // Fetch user roles with proper populate typing
      const userRoles = await UserRole.find({ userId }).populate<{
        roleId: Role;
      }>("roleId");

      if (!userRoles.length) {
        return res.status(200).json({
          message: "No roles found for user.",
          roles: [],
          permissions: [],
        });
      }

      // Type guard functions
      const isRole = (role: any): role is Role => {
        return role && typeof role === "object" && "_id" in role;
      };

      const isPermission = (permission: any): permission is Permission => {
        return (
          permission && typeof permission === "object" && "code" in permission
        );
      };

      // Extract role IDs safely
      const roleIds = userRoles.map((userRole) =>
        isRole(userRole.roleId) ? userRole.roleId._id : userRole.roleId
      );

      // Fetch permissions with proper typing
      const rolePermissions = await RolePermission.find({
        roleId: { $in: roleIds },
      }).populate<{ permissionId: Permission }>("permissionId");

      // Get all unique role names
      const roles = [
        ...new Set(
          userRoles
            .map((userRole) =>
              isRole(userRole.roleId) ? userRole.roleId.slug : ""
            )
            .filter(Boolean)
        ),
      ];

      // Get all unique permissions
      const permissions = [
        ...new Set(
          rolePermissions
            .map((rp) =>
              isPermission(rp.permissionId) ? rp.permissionId.code : ""
            )
            .filter(Boolean)
        ),
      ];

      // Create detailed response
      const detailedRolesAndPermissions = userRoles
        .map((userRole) => {
          const role = userRole.roleId;
          const roleName = isRole(role) ? role.slug : "";

          const permissions = rolePermissions
            .filter((rp) => {
              const rpRole = rp.roleId;
              return (
                isRole(rpRole) &&
                isRole(role) &&
                rpRole._id.toString() === role._id.toString()
              );
            })
            .map((rp) =>
              isPermission(rp.permissionId) ? rp.permissionId.code : ""
            )
            .filter(Boolean);

          return { roleName, permissions };
        })
        .filter((role) => role.roleName);

      return res.status(200).json({
        userId,
        roles,
        permissions,
        detailedRolesAndPermissions,
      });
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      return res.status(500).json({
        message: "Error fetching role permissions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
