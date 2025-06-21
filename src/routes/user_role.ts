import express from "express";
import { check } from "express-validator";
import {
  UserRoleRoutesUrls,
  UserRoutesUrls,
} from "../constants/routes";
import verifyToken from "../middleware/auth";
import { UserRoleServices } from "../services/user_roles";

const router = express.Router();

router.post(
  UserRoleRoutesUrls.ASSIGN_ROLES_TO_USER_URL,
  verifyToken,
  [
    check("userId", "User ID is required").isString(),
    check("roles", "Roles array is required").isArray(),
  ],
  UserRoleServices.assignRolesToUser
);

router.get(
  `${UserRoleRoutesUrls?.GET_USER_WITH_ROLES_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  UserRoleServices.getUserWithRoles
);

export default router;
