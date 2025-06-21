import express from "express";
import { body, check, param } from "express-validator";
import { EmployeeRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { EmployeeServices } from "../services/employee";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/employee"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post(
  EmployeeRoutesUrls.CREATE_EMPLOYEE_URL,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   body("employees").isArray().withMessage("Employees must be an array"),
  //   body("employees.*.clientId")
  //     .notEmpty()
  //     .withMessage("Client ID is required"),
  //   body("employees.*.title").notEmpty().withMessage("Title is required"),
  //   body("employees.*.linkUrl").optional().isString(),
  //   body("employees.*.description").optional().isString(),
  //   body("employees.*.image").optional().isString(),
  //   body("employees.*.status").optional().isBoolean(),
  // ],
  EmployeeServices.createEmployee
);

router.get(
  EmployeeRoutesUrls?.GET_ALL_EMPLOYEES_URL,
  verifyToken,
  EmployeeServices.getAllEmployees
);

router.put(
  `${EmployeeRoutesUrls?.UPDATE_EMPLOYEE_BY_ID_URL}/${EmployeeRoutesUrls?.DYNAMIC_EMPLOYEE_ID}`,
  verifyToken,
  upload.any(), // Handle any number of files
  // [
  //   param("employeeId").notEmpty().withMessage("Employee ID is required"),
  //   body("employees").isArray().withMessage("Employees must be an array"),
  //   body("employees.*.clientId")
  //     .notEmpty()
  //     .withMessage("Client ID is required"),
  //   body("employees.*.title").notEmpty().withMessage("Title is required"),
  //   body("employees.*.linkUrl").optional().isString(),
  //   body("employees.*.description").optional().isString(),
  //   body("employees.*.image").optional().isString(),
  //   body("employees.*.status").optional().isBoolean(),
  // ],
  EmployeeServices.updateEmployeeById
);
// soft delete and activate stuff
router.put(
  `${EmployeeRoutesUrls?.SOFT_DELETE_EMPLOYEE_BY_ID_URL}/${EmployeeRoutesUrls?.DYNAMIC_EMPLOYEE_ID}`,
  verifyToken,
  [param("employeeId").notEmpty().withMessage("Employee ID is required")],
  EmployeeServices.softDeleteEmployeeById
);
// activate
router.put(
  `${EmployeeRoutesUrls?.ACTIVATE_EMPLOYEE_BY_ID_URL}/${EmployeeRoutesUrls?.DYNAMIC_EMPLOYEE_ID}`,
  verifyToken,
  [param("employeeId").notEmpty().withMessage("Employee ID is required")],
  EmployeeServices.activateEmployeeById
);

router.get(
  `${EmployeeRoutesUrls?.GET_EMPLOYEE_BY_ID_URL}/${EmployeeRoutesUrls?.DYNAMIC_EMPLOYEE_ID}`,
  verifyToken,
  [param("employeeId").notEmpty().withMessage("Employee ID is required")],
  EmployeeServices.getEmployeeById
);
// permanent delete
router.delete(
  `${EmployeeRoutesUrls?.DELETE_EMPLOYEE_BY_ID_URL}/${EmployeeRoutesUrls?.DYNAMIC_EMPLOYEE_ID}`,
  verifyToken,
  [param("employeeId").notEmpty().withMessage("Employee ID is required")],
  EmployeeServices.deleteEmployeeById
);

export default router;
