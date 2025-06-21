import express from "express";
import { UserRoutesUrls } from "../constants/routes";
import { UserServices } from "../services/users";
import { check, param } from "express-validator";
import verifyToken from "../middleware/auth";

const router = express.Router();

// /api/users/register
router.post(
  UserRoutesUrls.REGISTER,
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters  required").isLength({
      min: 6,
    }),
  ],
  UserServices.registerUser
);

router.post(
  UserRoutesUrls.CREATE_USER_URL,
  verifyToken,
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("username", "Username is required").isString(),
    check("email", "Email is required").isEmail(),
  ],
  UserServices.createUser
);

router.get(
  UserRoutesUrls?.GET_AUTHORIZED_USERS_URL,
  verifyToken,
  UserServices.getAuthorizedUsers
);

router.get(
  UserRoutesUrls?.GET_ALL_USERS_URL,
  verifyToken,
  UserServices.getAllUsers
);

router.get(
  `${UserRoutesUrls?.GET_USER_BY_ID_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  UserServices.getUserById
);

router.put(
  `${UserRoutesUrls?.UPDATE_USER_BY_ID_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("username", "Username is required").isString(),
    check("email", "Email is required").isEmail(),
  ],
  UserServices.updateUserById
);

// soft delete and activate stuff
router.put(
  `${UserRoutesUrls?.SOFT_DELETE_USER_BY_ID_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  [param("userId").notEmpty().withMessage("User ID is required")],
  UserServices.softDeleteUserById
);
// activate
router.put(
  `${UserRoutesUrls?.ACTIVATE_USER_BY_ID_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  [param("userId").notEmpty().withMessage("User ID is required")],
  UserServices.activateUserById
);

router.delete(
  `${UserRoutesUrls?.DELETE_USER_BY_ID_URL}/${UserRoutesUrls?.DYNAMIC_USER_ID}`,
  verifyToken,
  UserServices.deleteUserById
);

export default router;
