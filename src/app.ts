import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { AppConfigs } from "./configs/app_configs";
import AboutRoutes from "./routes/about";
import AuthRoutes from "./routes/auth";
import ClientRoutes from "./routes/client";
import EmployeeRoutes from "./routes/employee";
import FileRoutes from "./routes/file";
import FileOldRoutes from "./routes/file_old";
import GalleryRoutes from "./routes/gallery";
import PermissionRoutes from "./routes/permissions";
import RolePermissionRoutes from "./routes/role_permission";
import RoleRoutes from "./routes/roles";
import ServiceRoutes from "./routes/service";
import SliderRoutes from "./routes/slider";
import UserRoleRoutes from "./routes/user_role";
import UserRoleAndPermssionRoutes from "./routes/user_role_and_permission";
import UserRoutes from "./routes/users";
import WebsiteRoutes from "./routes/website";
import ProductRoutes from "./routes/product";
import OrderRoutes from "./routes/order";
// const PaymentRoutes = require("./routes/payment");
import PaymentRoutes from "./routes/payment";

import path from "path";

import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import { ApiRouteConfigs } from "./constants/routes";

// mongodb
mongoose.connect(AppConfigs?.DB_CONNECTION);
// cloudinary
cloudinary.config({
  cloud_name: AppConfigs?.CLOUDINARY_CLOUD_NAME,
  api_key: AppConfigs?.CLOUDINARY_API_KEY,
  api_secret: AppConfigs?.CLOUDINARY_API_SECRET,
});

const allowedOrigins = [
  AppConfigs.FRONTEND_LOCAL_URL_1,
  AppConfigs.FRONTEND_LOCAL_URL_2,
  AppConfigs.FRONTEND_STAGING_URL,
  AppConfigs.FRONTEND_LIVE_URL,
  "https://marketplace-421115.el.r.appspot.com",
];

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// routes
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.USERS_ROUTE}`,
  UserRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.AUTH_ROUTE}`,
  AuthRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.PERMISSIONS_ROUTE}`,
  PermissionRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.ROLES_ROUTE}`,
  RoleRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.ROLE_PERMISSIONS_ROUTE}`,
  RolePermissionRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.USER_ROLES_ROUTE}`,
  UserRoleRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.USER_ROLES_AND_PERMISSIONS_ROUTE}`,
  UserRoleAndPermssionRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.CLIENT_ROUTE}`,
  ClientRoutes
);

app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.ABOUT}`,
  AboutRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.SLIDER}`,
  SliderRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.SERVICE}`,
  ServiceRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.EMPLOYEE}`,
  EmployeeRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.GALLERY}`,
  GalleryRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.PRODUCT}`,
  ProductRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.FILE}`,
  FileOldRoutes
);
app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.WEB}`,
  WebsiteRoutes
);

app.use(
  `/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.ORDER}`,
  OrderRoutes
);

app.use(`/${ApiRouteConfigs?.API_MODULE}/${ApiRouteConfigs?.FILE}`, FileRoutes);
// app.use("/payment", PaymentRoutes);
// Add this before your route mounting
app.use(`/${ApiRouteConfigs?.PAYMENT}`, PaymentRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(5000, () => {
  console.log("Server is running on localhost:5000");
});
