import { Request, Response } from "express";
import User from "../models/user";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages } from "../constants/messages";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppConfigs } from "../configs/app_configs";

export const AuthServices = {
  // login
  async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes?.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({
        email: email,
      });

      if (!user) {
        return res
          .status(HttpStatusCodes?.BAD_REQUEST)
          .json({ message: `${ErrorMessages?.INVALID_CREDENTIALS}` });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(HttpStatusCodes?.BAD_REQUEST)
          .json({ message: `${ErrorMessages?.INVALID_CREDENTIALS}` });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        AppConfigs.JWT_SECRET_KEY,
        {
          expiresIn: AppConfigs.JWT_EXPIRE_TIME,
        }
      );
      // res.cookie("auth_token", token, {
      //   httpOnly: true,
      //   // httpOnly: false,
      //   secure: AppConfigs?.NODE_ENV === "production",
      //   maxAge: 86400000, // AppConfigs?.JWT_EXPIRE_TIME = 1d
      //   // only works below in live hosted version
      //   // sameSite: 'none', // Allow cookies in cross-site requests
      // });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: AppConfigs?.NODE_ENV === "production", // Only secure in production
        sameSite: AppConfigs?.NODE_ENV === "production" ? "none" : "lax", // None for production, lax for local
        maxAge: 86400000, // 1 day in milliseconds
      });
      return res.status(HttpStatusCodes?.OK).json({
        userId: user?._id,
        // Add new properties here
        name: user?.firstName + " " + user.lastName,
        email: user?.email,
      });
    } catch (error) {
      // console.log(error);
      // test
      return res
        .status(HttpStatusCodes?.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages?.SERVER_ERROR}` });
    }
  },

  async validateToken(req: Request, res: Response) {
    res.status(HttpStatusCodes.OK).send({ userId: req.userId });
  },

  // async logout(req: Request, res: Response) {
  //   res.cookie("auth_token", "", {
  //     expires: new Date(0),
  //   });
  //   // res.send();
  //   res.status(200).json({ success: true, message: "Logged out successfully" });
  // },
  async logout(req: Request, res: Response) {
    res.cookie("auth_token", "", {
      httpOnly: true, // Match the same settings as when setting the cookie
      secure: AppConfigs?.NODE_ENV === "production", // Use secure only in production
      sameSite: AppConfigs?.NODE_ENV === "production" ? "none" : "lax", // Match sameSite setting
      expires: new Date(0), // Expire immediately
    });

    res
      .status(HttpStatusCodes.OK)
      .json({ success: true, message: "Logged out successfully" });
  },
};
