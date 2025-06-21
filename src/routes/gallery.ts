import express from "express";
import { check, param } from "express-validator";
import { GalleryRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { GalleryServices } from "../services/gallery";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/gallery"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB
});

router.post(
  GalleryRoutesUrls.CREATE_GALLERY_URL,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  GalleryServices.createGallery
);

router.get(
  GalleryRoutesUrls?.GET_ALL_GALLERIES_URL,
  verifyToken,
  GalleryServices.getAllGalleries
);

router.put(
  `${GalleryRoutesUrls?.UPDATE_GALLERY_BY_ID_URL}/${GalleryRoutesUrls?.DYNAMIC_GALLERY_ID}`,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   param("galleryId").notEmpty().withMessage("Gallery ID is required"),
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  GalleryServices.updateGalleryById
);
// soft delete and activate stuff
router.put(
  `${GalleryRoutesUrls?.SOFT_DELETE_GALLERY_BY_ID_URL}/${GalleryRoutesUrls?.DYNAMIC_GALLERY_ID}`,
  verifyToken,
  [param("galleryId").notEmpty().withMessage("Gallery ID is required")],
  GalleryServices.softDeleteGalleryById
);
// activate
router.put(
  `${GalleryRoutesUrls?.ACTIVATE_GALLERY_BY_ID_URL}/${GalleryRoutesUrls?.DYNAMIC_GALLERY_ID}`,
  verifyToken,
  [param("galleryId").notEmpty().withMessage("Gallery ID is required")],
  GalleryServices.activateGalleryById
);

router.get(
  `${GalleryRoutesUrls?.GET_GALLERY_BY_ID_URL}/${GalleryRoutesUrls?.DYNAMIC_GALLERY_ID}`,
  verifyToken,
  [param("galleryId").notEmpty().withMessage("Gallery ID is required")],
  GalleryServices.getGalleryById
);
// permanent delete
router.delete(
  `${GalleryRoutesUrls?.DELETE_GALLERY_BY_ID_URL}/${GalleryRoutesUrls?.DYNAMIC_GALLERY_ID}`,
  verifyToken,
  [param("galleryId").notEmpty().withMessage("Gallery ID is required")],
  GalleryServices.deleteGalleryById
);

export default router;
