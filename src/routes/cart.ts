import express from "express";
import { check, param } from "express-validator";
import { ProductRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { CartServices } from "../services/cart";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post(
  ProductRoutesUrls.CREATE_PRODUCT_URL,
  verifyToken,
  // Handle any number of files
  // [
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  CartServices.createProduct
);

router.get(
  ProductRoutesUrls?.GET_ALL_PRODUCTS_URL,
  verifyToken,
  CartServices.getAllProducts
);

router.put(
  `${ProductRoutesUrls?.UPDATE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  // Handle any number of files
  // [
  //   param("productId").notEmpty().withMessage("Product ID is required"),
  //   check("clientId", "Client ID is required").isString(),
  //   check("title", "Title is required").isString(),
  //   check("description", "Description is required").isString(),
  // ],
  CartServices.updateProductById
);
// soft delete and activate stuff
router.put(
  `${ProductRoutesUrls?.SOFT_DELETE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  CartServices.softDeleteProductById
);
// activate
router.put(
  `${ProductRoutesUrls?.ACTIVATE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  CartServices.activateProductById
);

router.get(
  `${ProductRoutesUrls?.GET_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  CartServices.getProductById
);
// permanent delete
router.delete(
  `${ProductRoutesUrls?.DELETE_PRODUCT_BY_ID_URL}/${ProductRoutesUrls?.DYNAMIC_PRODUCT_ID}`,
  verifyToken,
  [param("productId").notEmpty().withMessage("Product ID is required")],
  CartServices.deleteProductById
);

export default router;
