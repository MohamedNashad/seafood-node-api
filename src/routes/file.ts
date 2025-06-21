import express from "express";
import multer from "multer";
import { FileServices } from "../services/file";
import { FileRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload files
router.post(
  FileRoutesUrls.UPLOAD_FILES_URL,
  verifyToken,
  upload.array("files", 10),
  FileServices.uploadFiles
);

// Get all files
router.get(
  FileRoutesUrls.GET_ALL_FILES_URL,
  verifyToken,
  FileServices.getAllFiles
);

// Get a single file by ID
router.get(
  `${FileRoutesUrls.GET_FILE_BY_ID_URL}/${FileRoutesUrls.DYNAMIC_FILE_ID}`,
  FileServices.getFileById
);

// Update a file (replace with new file)
router.put(
  `${FileRoutesUrls.UPDATE_FILE_BY_ID_URL}/${FileRoutesUrls.DYNAMIC_FILE_ID}`,
  upload.single("file"),
  FileServices.updateFile
);

// Delete a file
router.delete(
  `${FileRoutesUrls.DELETE_FILE_BY_ID_URL}/${FileRoutesUrls.DYNAMIC_FILE_ID}`,
  FileServices.deleteFile
);

export default router;
