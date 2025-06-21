import "dotenv/config";

export const AppConfigs = {
  DB_CONNECTION: process.env.MONGODB_CONNECTION_STRING as string,
  NODE_ENV: process.env.NODE_ENV as string,
  FRONTEND_LOCAL_URL_1: process.env.FRONTEND_LOCAL_URL_1 as string,
  FRONTEND_LOCAL_URL_2: process.env.FRONTEND_LOCAL_URL_2 as string,

  FRONTEND_STAGING_URL: process.env.FRONTEND_STAGING_URL as string,
  FRONTEND_LIVE_URL: process.env.FRONTEND_LIVE_URL as string,
  
  // JWT
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,
  JWT_EXPIRE_TIME: process.env.JWT_EXPIRE_TIME as string,
  // CLOUDINARY
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
};
