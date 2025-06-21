import "dotenv/config";

export const PaymentGatewayConfigs = {
    // payhere
  MERCHANT_ID: process.env.MERCHANT_ID as string,
  MERCHANT_SECRET: process.env.MERCHANT_SECRET as string,
};