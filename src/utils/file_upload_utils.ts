// utils/fileUpload.ts
import multer, { Field } from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";

// Use Multer's Field type directly instead of custom FileConfig
type UploadConfig = {
  fields: Field[]; // Now using Multer's Field type directly
  fileSize?: number;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const moduleName = req.params.module || "general";
    const uploadPath = path.join(__dirname, `../../uploads/${moduleName}`);
    require("fs").mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

export const createUploader = (config: UploadConfig) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.fileSize || 5 * 1024 * 1024,
      files: config.fields.length,
    },
  }).fields(config.fields);
};

// Pre-configured uploaders using correct Field type
export const uploaders = {
  client: createUploader({
    fields: [
      { name: "image", maxCount: 1 },
      { name: "benefitImage", maxCount: 1 },
      { name: "cultureImage", maxCount: 1 },
    ] as Field[], // Explicitly type as Field[]
  }),
  about: createUploader({
    fields: [{ name: "image", maxCount: 1 }] as Field[],
  }),
//   slider: createUploader({
//     fields: [
//       { name: "image", maxCount: 1 },
//     ] as Field[],
//   }),
};

// Generic uploader now uses Field type
export const dynamicUploader = (fields: Field[]) => {
  return createUploader({ fields });
};
