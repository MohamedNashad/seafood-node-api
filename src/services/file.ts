import { Request, Response } from "express";
import cloudinary from "cloudinary";
import multer from "multer";
import FileModal from "../models/file";
// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const FileServices = {
  // Upload files
  async uploadFiles(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const result = await cloudinary.v2.uploader.upload(dataURI, {
          resource_type: "auto", // Automatically detect file type
          folder: "uploads", // Optional: Organize files in a folder
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          fileName: file.originalname,
          mimeType: file.mimetype,
        };
      });

      const results = await Promise.all(uploadPromises);
      const savedFiles = await FileModal.create(results);

      res.status(201).json(savedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  },

  // Get all files
  async getAllFiles(req: Request, res: Response) {
    try {
      const files = await FileModal.find();
      res.status(200).json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  },

  // Get a single file by ID
  async getFileById(req: Request, res: Response) {
    try {
      const file = await FileModal.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.status(200).json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  },

  // Update a file (replace with new file)
  async updateFile(req: Request, res: Response) {
    try {
      const file = req.file as Express.Multer.File;
      const fileId = req.params.id;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Find the existing file
      const existingFile = await FileModal.findById(fileId);
      if (!existingFile) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete the old file from Cloudinary
      await cloudinary.v2.uploader.destroy(existingFile.publicId, {
        resource_type: existingFile.resourceType,
      });

      // Upload the new file
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.v2.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "uploads",
      });

      // Update the file in the database
      existingFile.url = result.secure_url;
      existingFile.publicId = result.public_id;
      existingFile.resourceType = result.resource_type;
      existingFile.fileName = file.originalname;
      existingFile.mimeType = file.mimetype;
      await existingFile.save();

      res.status(200).json(existingFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  },

  // Delete a file
  async deleteFile(req: Request, res: Response) {
    try {
      const fileId = req.params.id;

      // Find the file
      const file = await FileModal.findById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete the file from Cloudinary
      await cloudinary.v2.uploader.destroy(file.publicId, {
        resource_type: file.resourceType,
      });

      // Delete the file from the database
      await FileModal.findByIdAndDelete(fileId);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  },
};
