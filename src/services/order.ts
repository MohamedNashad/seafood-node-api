// src/services/order.services.ts
import { Request, Response } from "express";
import Order, { CheckoutType, OrderStatus, OrderType } from "../models/order";
import Product from "../models/product";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages } from "../constants/messages";

export const OrderServices = {
  // Add to order.services.ts

  async createPendingOrder(req: Request, res: Response) {
    try {
      const { clientId, userId, cartItems, recipientInfo, paymentInfo, orderTotal } =
        req.body;

      const orderItems = cartItems.map((item: any) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const order = new Order({
        clientId,
        userId: userId || null, // null for guest checkout
        checkoutType: userId ? CheckoutType.SIGNUP : CheckoutType.GUEST,
        orderItems,
        recipientInfo,
        // paymentInfo: {
        //   paymentMethod,
        //   // --- For Online Payments ---
        //   gatewayReference: "", // Payment gateway's transaction ID
        //   maskedCardNumber: "", // "**** **** **** 4242" (last 4 digits only)
        //   cardBrand: "", // "VISA", "MASTERCARD"
        //   // --- For Bank Transfer ---
        //   bankReceiptUrl: "", // Uploaded receipt image URL
        //   // --- For COD ---
        //   cashReceived: "",
        // },
        paymentInfo,
        subtotal: orderTotal,
        shipping: 0, // Adjust as needed
        total: orderTotal,
        isPaid: false,
        status: OrderStatus.PENDING,
      });

      const createdOrder = await order.save();
      res.status(201).json({ orderId: createdOrder._id });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  },

  async verifyPayment(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      // Update order status to PAID
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          isPaid: true,
          paidAt: new Date(),
          status: OrderStatus.PROCESSING,
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update product quantities
      await Promise.all(
        order.orderItems.map(async (item) => {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { quantity: -item.quantity },
          });
        })
      );

      res.status(200).json({ message: "Payment verified" });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  },

  // Create a new order
  async createOrder(req: Request, res: Response) {
    try {
      const {
        clientId,
        cartItems,
        shippingInfo,
        paymentInfo,
        subtotal,
        shipping,
        total,
      } = req.body;

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "No items in cart" });
      }

      // Prepare order items
      const orderItems = cartItems.map((item: any) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        // image: item.image || item.images[0] || "",
      }));

      // Create the order
      const order = new Order({
        clientId: clientId,
        userId: req.userId,
        orderItems,
        shippingInfo,
        paymentInfo,
        subtotal,
        shipping,
        total,
        isPaid: true,
        paidAt: new Date(),
      });

      // Save the order
      const createdOrder = await order.save();

      // Update product quantities
      await Promise.all(
        cartItems.map(async (item: any) => {
          const product = await Product.findById(item.id);
          if (product) {
            product.quantity = Number(product.quantity) - item.quantity;
            await product.save();
          }
        })
      );

      return res.status(201).json({
        message: "Order created successfully",
        order: createdOrder,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get all orders for a user
  async getUserOrders(req: Request, res: Response) {
    try {
      const orders = await Order.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .populate("orderItems.productId", "name images");

      return res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  async getAllOrders(req: Request, res: Response) {
    try {
      // check the role and permissions
      const { userId, email } = req; // Assuming userId is in the request

      const [userPermissions, clientId] = await Promise.all([
        getUserRolesAndPermissions(userId.toString()), // Convert to string
        getClientIdByEmail(email?.toString()),
      ]);

      console.log(userPermissions, "-------userPermissions");
      console.log(clientId, "-------clientId");

      // Check permissions
      const isAdminOrSuperAdmin = userPermissions.roles.some((role) =>
        ["SUPER_ADMIN", "ADMIN"].includes(role)
      );

      const hasOrderViewPermission =
        userPermissions.permissions.includes("ORDER_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");

      // Authorization
      if (!hasOrderViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let orders;

      if (isAdminOrSuperAdmin) {
        orders = await Order.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        orders = await Order.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 });
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }

      res.status(HttpStatusCodes.OK).json(orders);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "orders!"}`,
      });
    }
  },

  // Get order by ID
  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { clientId } = req.body;

      const user = await req.userId;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const order = await Order.findOne({
        _id: id,
        $or: [{ userId: req.userId }, { clientId: clientId }],
      }).populate("orderItems.productId", "name images");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
