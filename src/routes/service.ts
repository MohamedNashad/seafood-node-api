import express from "express";
import { body, check, param } from "express-validator";
import { ServiceRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { ServiceServices } from "../services/service";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/service"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post(
  ServiceRoutesUrls.CREATE_SERVICE_URL,
  verifyToken,
  upload.any(), // Handle any number of files
  ServiceServices.createService
);

router.get(
  ServiceRoutesUrls?.GET_ALL_SERVICES_URL,
  verifyToken,
  ServiceServices.getAllServices
);

router.put(
  `${ServiceRoutesUrls?.UPDATE_SERVICE_BY_ID_URL}/${ServiceRoutesUrls?.DYNAMIC_SERVICE_ID}`,
  verifyToken,
  upload.any(), // Handle any number of files
  ServiceServices.updateServiceById
);
// soft delete and activate stuff
router.put(
  `${ServiceRoutesUrls?.SOFT_DELETE_SERVICE_BY_ID_URL}/${ServiceRoutesUrls?.DYNAMIC_SERVICE_ID}`,
  verifyToken,
  [param("serviceId").notEmpty().withMessage("Service ID is required")],
  ServiceServices.softDeleteServiceById
);
// activate
router.put(
  `${ServiceRoutesUrls?.ACTIVATE_SERVICE_BY_ID_URL}/${ServiceRoutesUrls?.DYNAMIC_SERVICE_ID}`,
  verifyToken,
  [param("serviceId").notEmpty().withMessage("Service ID is required")],
  ServiceServices.activateServiceById
);

router.get(
  `${ServiceRoutesUrls?.GET_SERVICE_BY_ID_URL}/${ServiceRoutesUrls?.DYNAMIC_SERVICE_ID}`,
  verifyToken,
  [param("serviceId").notEmpty().withMessage("Service ID is required")],
  ServiceServices.getServiceById
);
// permanent delete
router.delete(
  `${ServiceRoutesUrls?.DELETE_SERVICE_BY_ID_URL}/${ServiceRoutesUrls?.DYNAMIC_SERVICE_ID}`,
  verifyToken,
  [param("serviceId").notEmpty().withMessage("Service ID is required")],
  ServiceServices.deleteServiceById
);

export default router;
