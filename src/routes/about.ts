import express from "express";
import { check, param } from "express-validator";
import { AboutRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { AboutServices } from "../services/about";
import { createMultipleFileUploader } from "../utils/file_handler_utils";

const router = express.Router();

router.post(
  AboutRoutesUrls.CREATE_ABOUT_URL,
  verifyToken,
  createMultipleFileUploader("about", ["image"]), // Add file upload middleware
  [
    check("clientId", "Client ID is required").isString(),
    check("title", "Title is required").isString(),
    check("description", "Description is required").isString(),
  ],
  AboutServices.createAbout
);

router.get(
  AboutRoutesUrls?.GET_ALL_ABOUT_URL,
  verifyToken,
  AboutServices.getAllAbout
);

router.put(
  `${AboutRoutesUrls?.UPDATE_ABOUT_BY_ID_URL}/${AboutRoutesUrls?.DYNAMIC_ABOUT_ID}`,
  verifyToken,
  createMultipleFileUploader("about", ["image"]), // Add file upload middleware
  [
    param("aboutId").notEmpty().withMessage("About ID is required"),
    check("clientId", "Client ID is required").isString(),
    check("title", "Title is required").isString(),
    check("description", "Description is required").isString(),
  ],
  AboutServices.updateAboutById
);
// soft delete and activate stuff
router.put(
  `${AboutRoutesUrls?.SOFT_DELETE_ABOUT_BY_ID_URL}/${AboutRoutesUrls?.DYNAMIC_ABOUT_ID}`,
  verifyToken,
  [param("aboutId").notEmpty().withMessage("About ID is required")],
  AboutServices.softDeleteAboutById
);
// activate
router.put(
  `${AboutRoutesUrls?.ACTIVATE_ABOUT_BY_ID_URL}/${AboutRoutesUrls?.DYNAMIC_ABOUT_ID}`,
  verifyToken,
  [param("aboutId").notEmpty().withMessage("About ID is required")],
  AboutServices.activateAboutById
);

router.get(
  `${AboutRoutesUrls?.GET_ABOUT_BY_ID_URL}/${AboutRoutesUrls?.DYNAMIC_ABOUT_ID}`,
  verifyToken,
  [param("aboutId").notEmpty().withMessage("About ID is required")],
  AboutServices.getAboutById
);
// permanent delete
router.delete(
  `${AboutRoutesUrls?.DELETE_ABOUT_BY_ID_URL}/${AboutRoutesUrls?.DYNAMIC_ABOUT_ID}`,
  verifyToken,
  [param("aboutId").notEmpty().withMessage("About ID is required")],
  AboutServices.deleteAboutById
);

export default router;
