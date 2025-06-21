import express from "express";
import { check } from "express-validator";
import { RolePermissionRoutesUrls, RoleRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { RolePermissionServices } from "../services/role_permissions";

const router = express.Router();

// assign permissions
router.post(
  RolePermissionRoutesUrls.ASSIGN_PERMISSIONS_TO_ROLE_URL,
  verifyToken,
  [
    check("roleId", "Role ID is required").isString(),
    check("permissions", "Permissions array is required").isArray(),
  ],
  RolePermissionServices.assignPermissionsToRole
);

router.get(
  `${RolePermissionRoutesUrls?.GET_ROLE_WITH_PERMISSIONS_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  RolePermissionServices.getRoleWithPermissions
);

export default router;
