// const express = require("express");
// const crypto = require("crypto");

// const router = express.Router();

// // Merchant details
// const merchant_id = "1230472"; // Replace with your actual Merchant ID
// const merchant_secret =
//   "Mjc1Mzk2OTk4MjMxOTExMjA1MDYxOTczMzg2NjM0Mzc2NTcxMzM2MQ=="; // Replace with your Merchant Secret

// router.post("/start", (req: any, res: any) => {
//   const { order_id, amount, currency } = req.body;
//   console.log("Payment request for order:", order_id);

//   // Generate the hash value
//   const hash = crypto
//     .createHash("md5")
//     .update(
//       merchant_id +
//         order_id +
//         amount +
//         currency +
//         crypto
//           .createHash("md5")
//           .update(merchant_secret)
//           .digest("hex")
//           .toUpperCase()
//     )
//     .digest("hex")
//     .toUpperCase();

//   console.log("Hash generated for order:", order_id);

//   res.json({ hash, merchant_id });
// });

// // Payment notification endpoint
// router.post("/notify", (req: any, res: any) => {
  // console.log("Payment notification received");

  // const {
  //   merchant_id,
  //   order_id,
  //   payhere_amount,
  //   payhere_currency,
  //   status_code,
  //   md5sig,
  // } = req.body;

  // const local_md5sig = crypto
  //   .createHash("md5")
  //   .update(
  //     merchant_id +
  //       order_id +
  //       payhere_amount +
  //       payhere_currency +
  //       status_code +
  //       crypto
  //         .createHash("md5")
  //         .update(merchant_secret)
  //         .digest("hex")
  //         .toUpperCase()
  //   )
  //   .digest("hex")
  //   .toUpperCase();

  // console.log("Payment notification for order:", order_id);

  // if (local_md5sig === md5sig && status_code == "2") {
  //   // Payment success - update the database
  //   console.log("Payment successful for order:", order_id);
  //   res.sendStatus(200);
  // } else {
  //   // Payment verification failed
  //   console.log("Payment verification failed for order:", order_id);
  //   res.sendStatus(400);
  // }
// });

// module.exports = router;

// new method
import express from "express";
import { check, param } from "express-validator";
import { PaymentRoutesUrls } from "../constants/routes";
import verifyToken from "../middleware/auth";
import { PaymentServices } from "../services/payment";

const router = express.Router();

router.post(
  PaymentRoutesUrls.START,
  // verifyToken,
  [
    check("order_id", "Order ID is required").isString(),
    check("amount", "Amount is required").isString(),
    check("currency", "Currency is required").isString(),
  ],
  PaymentServices.startPayment
);

router.post(
  PaymentRoutesUrls?.NOTIFY,
  // verifyToken,
  // [
  //   check("merchant_id", "Merchant ID is required").isString(),
  //   check("order_id", "Order ID is required").isString(),
  //   check("payhere_amount", "Payhere Amount is required").isString(),
  //   check("payhere_currency", "Payhere Currency is required").isString(),
  //   check("status_code", "Status Code is required").isString(),
  //   check("md5sig", "MD5 Signature is required").isString(),
  // ],
  PaymentServices.notifyPayment
);

export default router;
