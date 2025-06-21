import express from "express";
import {
  UserRoleAndPermissionRoutesUrls,
} from "../constants/routes";
import verifyToken from "../middleware/auth";
import { UserRoleAndPermissionServices } from "../services/user_role_and_permissions";

const router = express.Router();

router.get(
  `${UserRoleAndPermissionRoutesUrls?.LOGGED_IN_USER_ASSIGNED_ROLES_AND_PERMISSIONS_URL}`,
  verifyToken,
  UserRoleAndPermissionServices.getLoggedInUserRoleWithPermissions
);

export default router;
