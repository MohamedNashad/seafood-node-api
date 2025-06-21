import express from "express";
import { check, param } from "express-validator";
import { RoleRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { RoleServices } from "../services/roles";

const router = express.Router();

// /api/roles/create-role
router.post(
  RoleRoutesUrls.CREATE_ROLE_URL,
  verifyToken,
  [
    check("slug", "Slug is required").isString(),
    check("name", "Name is required").isString(),
    check("description", "Description is required").isString(),
  ],
  RoleServices.createRole
);

router.get(
  RoleRoutesUrls?.GET_ALL_ROLES_WITHOUT_AUTHENTICATION_URL,
  RoleServices.getAllRolesWithoutAuth
);

router.get(
  RoleRoutesUrls?.GET_ALL_ROLES_URL,
  verifyToken,
  RoleServices.getAllRoles
);

router.put(
  `${RoleRoutesUrls?.UPDATE_ROLE_BY_ID_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  [
    param("roleId").notEmpty().withMessage("Role ID is required"),
    check("slug", "Slug is required").isString(),
    check("name", "Name is required").isString(),
    check("description", "Description is required").isString(),
  ],
  RoleServices.updateRoleById
);

// soft delete and activate stuff
router.put(
  `${RoleRoutesUrls?.SOFT_DELETE_ROLE_BY_ID_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  [param("roleId").notEmpty().withMessage("Role ID is required")],
  RoleServices.softDeleteRoleById
);

// activate
router.put(
  `${RoleRoutesUrls?.ACTIVATE_ROLE_BY_ID_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  [param("roleId").notEmpty().withMessage("Role ID is required")],
  RoleServices.activateRoleById
);

router.get(
  `${RoleRoutesUrls?.GET_ROLE_BY_ID_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  [param("roleId").notEmpty().withMessage("Role ID is required")],
  RoleServices.getRoleById
);

router.delete(
  `${RoleRoutesUrls?.DELETE_ROLE_BY_ID_URL}/${RoleRoutesUrls?.DYNAMIC_ROLE_ID}`,
  verifyToken,
  [param("roleId").notEmpty().withMessage("Role ID is required")],
  RoleServices.deleteRoleById
);

export default router;
