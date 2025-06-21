import cloudinary from "cloudinary";
import { Readable } from "stream";

// export async function uploadImages(imageFiles: Express.Multer.File[]) {
//   try {
//     const uploadPromises = imageFiles.map(async (image) => {
//       if (!image.mimetype.startsWith("image/")) {
//         throw new Error("Invalid file type. Only images are allowed.");
//       }
//       const b64 = Buffer.from(image.buffer).toString("base64");
//       let dataURI = "data:" + image.mimetype + ";base64," + b64;
//       const res = await cloudinary.v2.uploader.upload(dataURI);
//       return res.url;
//     });

//     const imageUrls = await Promise.all(uploadPromises);
//     console.log(imageUrls, "--------IMG-URLS");

//     return imageUrls;
//   } catch (error) {
//     console.error("Error uploading images:", error);
//     throw new Error("Failed to upload images.");
//   }
// }

export async function uploadImages(imageFiles: Express.Multer.File[]) {
  try {
    const uploadPromises = imageFiles.map(async (image) => {
      if (!image.mimetype.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
      }
      const b64 = Buffer.from(image.buffer).toString("base64");
      let dataURI = "data:" + image.mimetype + ";base64," + b64;
      const res = await cloudinary.v2.uploader.upload(dataURI);
      return res.secure_url; // Use secure_url for HTTPS
    });

    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error("Failed to upload images.");
  }
}

// Utility for uploading image to Cloudinary
// export const uploadImageToCloudinary = async (file: Express.Multer.File) => {
//   try {
//     const result = await cloudinary.v2.uploader.upload(file.path);
//     return result.secure_url;
//   } catch (error) {
//     console.error("Error uploading image to Cloudinary:", error);
//     throw new Error("Failed to upload image");
//   }
// };

export const uploadImageToCloudinary = async (file: Express.Multer.File) => {
  try {
    // Convert buffer to stream
    const stream = Readable.from(file.buffer);

    // Create a promise-based upload
    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error("Failed to upload image to Cloudinary"));
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      // Pipe the file buffer to Cloudinary
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Image upload failed");
  }
};

export const deleteImageFromCloudinary = async (imageUrl: string) => {
  try {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];
    if (!publicId) {
      console.warn("Could not extract publicId from URL:", imageUrl);
      return;
    }

    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error("Failed to delete image");
  }
};
