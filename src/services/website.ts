import { ErrorMessages } from "../constants/messages";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { Request, Response } from "express";
import Client from "../models/client";
import { validationResult } from "express-validator";
import About from "../models/about";
import Slider from "../models/slider";
import Service from "../models/service";
import Employee from "../models/employee";
import Product from "../models/product";

export const WebsiteServices = {
  async getWebClientByUniqueIdentifier(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { webClientId } = req.params;

    try {
      const client = await Client.findOne({
        _id: webClientId,
        isDelete: false,
      }).select("-__v");

      if (!client)
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });

      // Get all related documents
      const [abouts, sliders, services, employees, products] =
        await Promise.all([
          About.find({ clientId: webClientId, isDelete: false }).select(
            "-__v -clientId"
          ),
          Slider.find({ clientId: webClientId, isDelete: false }).select(
            "-__v -clientId"
          ),
          Service.find({ clientId: webClientId, isDelete: false }).select(
            "-__v -clientId"
          ),
          Employee.find({ clientId: webClientId, isDelete: false }).select(
            "-__v -clientId"
          ),
          Product.find({ clientId: webClientId, isDelete: false }).select(
            "-__v -clientId"
          ),
        ]);

      // Combine all data into a single response
      const response = {
        ...client.toObject(),
        abouts,
        sliders,
        services,
        employees,
        products,
      };

      res.json(response);
    } catch (error) {
      res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.FETCHING_ERROR} client!` });
    }
  },
};
