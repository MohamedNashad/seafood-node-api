// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { Request } from "express";
// import { v4 as uuidv4 } from "uuid";

// // Configure storage
// const storage = multer.diskStorage({
//   destination: (req: Request, file, cb) => {
//     const moduleName = req.params.module || "general";
//     const uploadPath = path.join(__dirname, `../uploads/${moduleName}`);

//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// // Initialize multer
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// });

// // File upload middleware
// export const handleFileUpload = (fieldName: string) => {
//   return upload.single(fieldName);
// };

// // File upload middleware for multiple files
// export const handleMultipleFiles = (
//   fieldName: string,
//   maxCount: number = 5
// ) => {
//   return upload.array(fieldName, maxCount);
// };

// // Delete file utility
// export const deleteFile = (module: string, filename: string) => {
//   const filePath = path.join(__dirname, `../uploads/${module}`, filename);
//   if (fs.existsSync(filePath)) {
//     fs.unlinkSync(filePath);
//     return true;
//   }
//   return false;
// };

// // Get file URL
// export const getFileUrl = (req: Request, module: string, filename: string) => {
//   return `${req.protocol}://${req.get("host")}/uploads/${module}/${filename}`;
// };

import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// Configure dynamic storage
const getStorage = (module: string) =>
  multer.diskStorage({
    destination: (req: Request, file, cb) => {
      const uploadPath = path.join(__dirname, `../uploads/${module}`);

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

// Middleware creator
export const createSingleFileUploader = (module: string, fieldName: string) => {
  return multer({
    storage: getStorage(module),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }).single(fieldName);
};

// Modified to handle multiple files
export const createMultipleFileUploader = (
  module: string,
  fieldNames: string[]
) => {
  return multer({
    storage: getStorage(module),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }).fields(fieldNames.map((name) => ({ name, maxCount: 1 })));
};

// Delete file utility
export const deleteFile = (module: string, filename: string) => {
  const filePath = path.join(__dirname, `../uploads/${module}`, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Delete files utility
// Delete files utility - properly typed version
export const deleteFiles = async (
  module: string,
  imagePaths: string[]
): Promise<void> => {
  const deletePromises = imagePaths.map(async (imagePath) => {
    if (imagePath) {
      try {
        await deleteFile(module, imagePath);
      } catch (err) {
        console.error(`Error deleting file ${imagePath}:`, err);
        // Swallow the error - we want to continue even if deletion fails
      }
    }
  });
  await Promise.all(deletePromises);
  // No explicit return needed - async functions return Promise<void> by default
};

// Get file URL
export const getFileUrl = (req: Request, module: string, filename: string) => {
  return `${req.protocol}://${req.get("host")}/uploads/${module}/${filename}`;
};
