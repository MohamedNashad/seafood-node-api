import express from "express";
import { AuthRoutesUrls } from "../constants/routes";
import { AuthServices } from "../services/auth";
import { check } from "express-validator";
import verifyToken from "../middleware/auth";

const router = express.Router();

// /api/auth/login
router.post(
  AuthRoutesUrls.LOGIN,
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters  required").isLength({
      min: 6,
    }),
  ],
  AuthServices.login
);

router.get(
  AuthRoutesUrls.VALIDATE_TOKEN,
  verifyToken,
  AuthServices.validateToken
);

router.post(AuthRoutesUrls.LOGOUT, AuthServices.logout);

export default router;
