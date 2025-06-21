import express from "express";
import { check, param } from "express-validator";
import { ClientRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { ClientServices } from "../services/client";
import { createMultipleFileUploader } from "../utils/file_handler_utils";

const router = express.Router();

// /api/roles/create-role
router.post(
  ClientRoutesUrls.CREATE_CLIENT_URL,
  verifyToken,
  createMultipleFileUploader("client", [
    "image",
    "benefitsImage",
    "cultureImage",
  ]), // Explicitly specify module and field
  [
    check("name", "Name is required").notEmpty(),
    check("phone", "Phone is required").notEmpty(),
  ],
  ClientServices.createClient
);

router.get(
  ClientRoutesUrls?.GET_ALL_CLIENTS_URL,
  verifyToken,
  ClientServices.getAllClients
);

router.put(
  `${ClientRoutesUrls?.UPDATE_CLIENT_BY_ID_URL}/${ClientRoutesUrls?.DYNAMIC_CLIENT_ID}`,
  verifyToken,
  createMultipleFileUploader("client", [
    "image",
    "benefitsImage",
    "cultureImage",
  ]), // Explicitly specify module and field
  [
    param("clientId").notEmpty().withMessage("Client ID is required"),
    check("name", "Name is required").notEmpty(),
    check("phone", "Phone is required").notEmpty(),
  ],
  ClientServices.updateClientById
);

// soft delete and activate stuff
router.put(
  `${ClientRoutesUrls?.SOFT_DELETE_CLIENT_BY_ID_URL}/${ClientRoutesUrls?.DYNAMIC_CLIENT_ID}`,
  verifyToken,
  [param("clientId").notEmpty().withMessage("Client ID is required")],
  ClientServices.softDeleteClientById
);

// activate
router.put(
  `${ClientRoutesUrls?.ACTIVATE_CLIENT_BY_ID_URL}/${ClientRoutesUrls?.DYNAMIC_CLIENT_ID}`,
  verifyToken,
  [param("clientId").notEmpty().withMessage("Client ID is required")],
  ClientServices.activateClientById
);

router.get(
  `${ClientRoutesUrls?.GET_CLIENT_BY_ID_URL}/${ClientRoutesUrls?.DYNAMIC_CLIENT_ID}`,
  verifyToken,
  [param("clientId").notEmpty().withMessage("Client ID is required")],
  ClientServices.getClientById
);

router.delete(
  `${ClientRoutesUrls?.DELETE_CLIENT_BY_ID_URL}/${ClientRoutesUrls?.DYNAMIC_CLIENT_ID}`,
  verifyToken,
  [param("clientId").notEmpty().withMessage("Client ID is required")],
  ClientServices.deleteClientById
);

export default router;
