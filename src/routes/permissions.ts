import express from "express";
import { check, param } from "express-validator";
import { PermissionRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { PermissionServices } from "../services/permissions";

const router = express.Router();

router.post(
  PermissionRoutesUrls.CREATE_PERMISSION_URL,
  verifyToken,
  [
    check("code", "Code is required").isString(),
    check("name", "Name is required").isString(),
    check("type", "Type is required").isString(),
  ],
  PermissionServices.createPermission
);

router.get(
  PermissionRoutesUrls?.GET_ALL_PERMISSIONS_URL,
  verifyToken,
  PermissionServices.getAllPermissions
);

router.put(
  `${PermissionRoutesUrls?.UPDATE_PERMISSION_BY_ID_URL}/${PermissionRoutesUrls?.DYNAMIC_PERMISSION_ID}`,
  verifyToken,
  [
    param("permissionId").notEmpty().withMessage("Permission ID is required"),
    check("code", "Code is required").isString(),
    check("name", "Name is required").isString(),
    check("type", "Type is required").isString(),
  ],
  PermissionServices.updatePermissionById
);
// soft delete and activate stuff
router.put(
  `${PermissionRoutesUrls?.SOFT_DELETE_PERMISSION_BY_ID_URL}/${PermissionRoutesUrls?.DYNAMIC_PERMISSION_ID}`,
  verifyToken,
  [param("permissionId").notEmpty().withMessage("Permission ID is required")],
  PermissionServices.softDeletePermissionById
);
// activate
router.put(
  `${PermissionRoutesUrls?.ACTIVATE_PERMISSION_BY_ID_URL}/${PermissionRoutesUrls?.DYNAMIC_PERMISSION_ID}`,
  verifyToken,
  [param("permissionId").notEmpty().withMessage("Permission ID is required")],
  PermissionServices.activatePermissionById
);

router.get(
  `${PermissionRoutesUrls?.GET_PERMISSION_BY_ID_URL}/${PermissionRoutesUrls?.DYNAMIC_PERMISSION_ID}`,
  verifyToken,
  [param("permissionId").notEmpty().withMessage("Permission ID is required")],
  PermissionServices.getPermissionById
);
// permanent delete
router.delete(
  `${PermissionRoutesUrls?.DELETE_PERMISSION_BY_ID_URL}/${PermissionRoutesUrls?.DYNAMIC_PERMISSION_ID}`,
  verifyToken,
  [param("permissionId").notEmpty().withMessage("Permission ID is required")],
  PermissionServices.deletePermissionById
);

export default router;
