import express from "express";
import { check, param } from "express-validator";
import { ProductRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { ProductServices } from "../services/product";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/product"));
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
  ProductRoutesUrls.CREATE_PRODUCT_URL,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  ProductServices.createProduct
);

router.get(
  ProductRoutesUrls?.GET_ALL_PRODUCTS_URL,
  verifyToken,
  ProductServices.getAllProducts
);

router.put(
  `${ProductRoutesUrls?.UPDATE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   param("productId").notEmpty().withMessage("Product ID is required"),
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  ProductServices.updateProductById
);
// soft delete and activate stuff
router.put(
  `${ProductRoutesUrls?.SOFT_DELETE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  ProductServices.softDeleteProductById
);
// activate
router.put(
  `${ProductRoutesUrls?.ACTIVATE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  ProductServices.activateProductById
);

router.get(
  `${ProductRoutesUrls?.GET_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  ProductServices.getProductById
);
// permanent delete
router.delete(
  `${ProductRoutesUrls?.DELETE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  ProductServices.deleteProductById
);

export default router;
