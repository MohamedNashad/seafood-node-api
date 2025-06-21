import express from "express";
import { body, check, param } from "express-validator";
import { SliderRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { SliderServices } from "../services/slider";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/slider"));
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
  SliderRoutesUrls.CREATE_SLIDER_URL,
  verifyToken,
  upload.any(), // Handle any number of files
  // upload.any(), // This will handle all files and fields
  // [
  //   body("sliders").isArray().withMessage("Sliders must be an array"),
  //   // body("sliders.*.clientId").notEmpty().withMessage("Client ID is required"),
  //   // body("sliders.*.title").notEmpty().withMessage("Title is required"),
  //   // body("sliders.*.buttonUrl").optional().isString(),
  //   // body("sliders.*.description").optional().isString(),
  //   // body("sliders.*.image").optional().isString(),
  //   // body("sliders.*.status").optional().isBoolean(),
  // ],
  SliderServices.createSlider
);

router.get(
  SliderRoutesUrls?.GET_ALL_SLIDERS_URL,
  verifyToken,
  SliderServices.getAllSliders
);

router.put(
  `${SliderRoutesUrls?.UPDATE_SLIDER_BY_ID_URL}/${SliderRoutesUrls?.DYNAMIC_SLIDER_ID}`,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   param("sliderId").notEmpty().withMessage("Slider ID is required"),
  //   body("sliders").isArray().withMessage("Sliders must be an array"),
  //   body("sliders.*.clientId").notEmpty().withMessage("Client ID is required"),
  //   body("sliders.*.title").notEmpty().withMessage("Title is required"),
  //   body("sliders.*.buttonUrl").optional().isString(),
  //   body("sliders.*.description").optional().isString(),
  //   body("sliders.*.image").optional().isString(),
  //   body("sliders.*.status").optional().isBoolean(),
  // ],
  SliderServices.updateSliderById
);
// soft delete and activate stuff
router.put(
  `${SliderRoutesUrls?.SOFT_DELETE_SLIDER_BY_ID_URL}/${SliderRoutesUrls?.DYNAMIC_SLIDER_ID}`,
  verifyToken,
  [param("sliderId").notEmpty().withMessage("Slider ID is required")],
  SliderServices.softDeleteSliderById
);
// activate
router.put(
  `${SliderRoutesUrls?.ACTIVATE_SLIDER_BY_ID_URL}/${SliderRoutesUrls?.DYNAMIC_SLIDER_ID}`,
  verifyToken,
  [param("sliderId").notEmpty().withMessage("Slider ID is required")],
  SliderServices.activateSliderById
);

router.get(
  `${SliderRoutesUrls?.GET_SLIDER_BY_ID_URL}/${SliderRoutesUrls?.DYNAMIC_SLIDER_ID}`,
  verifyToken,
  [param("sliderId").notEmpty().withMessage("Slider ID is required")],
  SliderServices.getSliderById
);
// permanent delete
router.delete(
  `${SliderRoutesUrls?.DELETE_SLIDER_BY_ID_URL}/${SliderRoutesUrls?.DYNAMIC_SLIDER_ID}`,
  verifyToken,
  [param("sliderId").notEmpty().withMessage("Slider ID is required")],
  SliderServices.deleteSliderById
);

export default router;
