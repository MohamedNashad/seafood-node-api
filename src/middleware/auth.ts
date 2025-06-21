import { HttpStatusCodes } from "../constants/http_status_codes";
import { Request, Response, NextFunction } from "express";
import { AppConfigs } from "../configs/app_configs";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      email: string;
    }
  }
}
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, AppConfigs.JWT_SECRET_KEY);
    req.userId = (decoded as JwtPayload).userId;
    req.email = (decoded as JwtPayload).email;
    next();
  } catch (error) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ message: "Unauthorized" });
  }
};

export default verifyToken;
