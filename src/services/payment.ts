import { Request, Response } from "express";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages } from "../constants/messages";
import { PaymentGatewayConfigs } from "../configs/payment_gateway_configs";
import crypto from "crypto";

let merchant_id = PaymentGatewayConfigs.MERCHANT_ID;
let merchant_secret = PaymentGatewayConfigs.MERCHANT_SECRET;

export const PaymentServices = {
  // Create a new order
  async startPayment(req: Request, res: Response) {
    const { order_id, amount, currency } = req.body;
    console.log("Payment request for order:", order_id);

    // Generate the hash value
    const hash = crypto
      .createHash("md5")
      .update(
        merchant_id +
          order_id +
          amount +
          currency +
          crypto
            .createHash("md5")
            .update(merchant_secret)
            .digest("hex")
            .toUpperCase()
      )
      .digest("hex")
      .toUpperCase();

    console.log("Hash generated for order:", order_id);

    res.json({ hash, merchant_id });
  },

  async notifyPayment(req: Request, res: Response) {
    console.log("Payment notification received");

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body;

    const local_md5sig = crypto
      .createHash("md5")
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          crypto
            .createHash("md5")
            .update(merchant_secret)
            .digest("hex")
            .toUpperCase()
      )
      .digest("hex")
      .toUpperCase();

    console.log("Payment notification for order:", order_id);

    if (local_md5sig === md5sig && status_code == "2") {
      // Payment success - update the database
      console.log("Payment successful for order:", order_id);
      res.sendStatus(200);
    } else {
      // Payment verification failed
      console.log("Payment verification failed for order:", order_id);
      res.sendStatus(400);
    }
  },
};
