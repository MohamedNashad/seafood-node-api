import express from "express";
import { check, param } from "express-validator";
import { OrderRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { OrderServices } from "../services/order";

const router = express.Router();

// /api/roles/create-pending-order
router.post(
  OrderRoutesUrls.CREATE_PENDING_ORDER_URL,
  // verifyToken, // no need cuz sometimes guest checkouts
  //   [
  //     check("slug", "Slug is required").isString(),
  //     check("name", "Name is required").isString(),
  //     check("description", "Description is required").isString(),
  //   ],
  OrderServices.createPendingOrder
);

router.post(
  `${OrderRoutesUrls?.DYNAMIC_ORDER_ID}/${OrderRoutesUrls?.VERIFY_PAYMENT_URL}`,
  // verifyToken,
  OrderServices.verifyPayment
);

router.post(
  OrderRoutesUrls.CREATE_ORDER_URL,
  verifyToken,
  //   [
  //     check("slug", "Slug is required").isString(),
  //     check("name", "Name is required").isString(),
  //     check("description", "Description is required").isString(),
  //   ],
  OrderServices.createOrder
);

// router.get(
//   OrderRoutesUrls?.GET_USER_ORDERS_URL,
//   verifyToken,
//   OrderServices.getUserOrders
// );

// router.get(
//   OrderRoutesUrls?.GET_ALL_ORDERS_URL,
//   verifyToken,
//   OrderServices.getAllOrders
// );

// router.get(
//   `${OrderRoutesUrls?.GET_ORDER_BY_ID_URL}/${OrderRoutesUrls?.DYNAMIC_ORDER_ID}`,
//   verifyToken,
//   //   [
//   //     param("roleId").notEmpty().withMessage("Role ID is required"),
//   //     check("slug", "Slug is required").isString(),
//   //     check("name", "Name is required").isString(),
//   //     check("description", "Description is required").isString(),
//   //   ],
//   OrderServices.getOrderById
// );

// soft delete and activate stuff
// router.put(
//   `${OrderRoutesUrls?.SOFT_DELETE_ORDER_BY_ID_URL}/${OrderRoutesUrls?.DYNAMIC_ORDER_ID}`,
//   verifyToken,
//   [param("roleId").notEmpty().withMessage("Role ID is required")],
//   OrderServices.softDeleteOrderById
// );

// // activate
// router.put(
//   `${OrderRoutesUrls?.ACTIVATE_ORDER_BY_ID_URL}/${OrderRoutesUrls?.DYNAMIC_ORDER_ID}`,
//   verifyToken,
//   [param("roleId").notEmpty().withMessage("Role ID is required")],
//   OrderServices.activateOrderById
// );

// router.get(
//   `${OrderRoutesUrls?.GET_ORDER_BY_ID_URL}/${OrderRoutesUrls?.DYNAMIC_ORDER_ID}`,
//   verifyToken,
//   [param("roleId").notEmpty().withMessage("Role ID is required")],
//   OrderServices.getOrderById
// );

// router.delete(
//   `${OrderRoutesUrls?.DELETE_ORDER_BY_ID_URL}/${OrderRoutesUrls?.DYNAMIC_ORDER_ID}`,
//   verifyToken,
//   [param("roleId").notEmpty().withMessage("Role ID is required")],
//   OrderServices.deleteOrderById
// );

export default router;
