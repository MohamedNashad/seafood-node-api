import express from "express";
import { param } from "express-validator";
import { WebsiteRoutesUrls } from "../constants/routes";
import { WebsiteServices } from "../services/website";

const router = express.Router();
// this endpoint is public
router.get(
  `${WebsiteRoutesUrls.GET_WEBSITE_CLIENT_DETAILS}/${WebsiteRoutesUrls?.DYNAMIC_CLIENT_WEB_ID}`,
  [param("webClientId").notEmpty().withMessage("Client ID is required!")],
  WebsiteServices.getWebClientByUniqueIdentifier
);

export default router;
