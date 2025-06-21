import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { uploadImages } from "../utils/files_utils";// Import the Mongoose model
import ImageModel from "../models/image";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/upload-images",
  upload.array("image", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const imageUrls = await uploadImages(imageFiles); // Use the existing uploadImages function
      // Save image URLs to MongoDB
      const savedImages = await ImageModel.create(
        imageUrls.map((url) => ({ url }))
      );

      res.status(200).json({ imageUrls });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  }
);

export default router;
