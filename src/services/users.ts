import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { AppConfigs } from "../configs/app_configs";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import User from "../models/user";
import UserRole from "../models/user_role";
import { sendContentWithMail } from "../utils/send_mail_utils";
import generator from "generate-password";
import mongoose from "mongoose";
import { getUserRolesAndPermissions } from "../utils/auth_utils";

export const UserServices = {
  // register
  async registerUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes?.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const { email, password, firstName, lastName } = req.body;

    try {
      let user = await User.findOne({
        email: email,
      });
      if (user) {
        return res
          .status(HttpStatusCodes?.BAD_REQUEST)
          .json({ message: `User ${ErrorMessages?.ALREADY_EXISTS}` });
      }

      user = new User({
        email: email,
        // passsword is hashed in the User Model, before saving here
        password: password,
        firstName: firstName,
        lastName: lastName,
      });

      // let userDetails = await user.save();
      await user.save();

      const token = jwt.sign(
        {
          userId: user.id,
        },
        AppConfigs.JWT_SECRET_KEY,
        {
          expiresIn: AppConfigs.JWT_EXPIRE_TIME,
        }
      );
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: AppConfigs?.NODE_ENV === "production",
        maxAge: 86400000, // AppConfigs?.JWT_EXPIRE_TIME =  // 1 day in ms
      });
      return res
        .status(HttpStatusCodes?.OK)
        .send({ message: "User registered successfully!" });
    } catch (error: any) {
      console.log(error);
      return res
        .status(HttpStatusCodes?.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages?.SERVER_ERROR}` });
    }
  },

  //  (For Admin-Created User with Email Password)
  async createUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ message: errors.array() });
    }

    const { email, firstName, lastName, username, password } = req.body;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let existingUser = await User.findOne(
        {
          $or: [{ email }, { username }],
          isDelete: false,
        },
        null,
        { session }
      );
      if (existingUser) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ message: `User ${ErrorMessages.ALREADY_EXISTS}` });
      }

      const user = new User({
        email,
        firstName,
        lastName,
        username,
        password,
        createdBy: req.userId,
      });

      await user.save({ session });
      // Commit the transaction
      await session.commitTransaction();

      return res.status(HttpStatusCodes.OK).json({
        success: true,
        message: `Please check your email (${user.email}) for account access details.`,
        user: user,
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await session.abortTransaction();
      console.error("Error creating user:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async getAuthorizedUsers(req: Request, res: Response) {
    try {
      const users = await User.find({ createdBy: req.userId })
        .select("-__v")
        .sort({ updatedAt: -1 })
        .populate([
          {
            path: "createdBy", // Populate createdBy field
            select: "_id firstName lastName", // Select only _id, firstName, lastName
          },
          {
            path: "updatedBy", // Populate updatedBy field
            select: "_id firstName lastName", // Select only _id, firstName, lastName
          },
        ]);
      res.status(HttpStatusCodes.OK).json(users);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "roles!"}`,
      });
    }
  },

  async getAllUsers(req: Request, res: Response) {
    try {
      // check the role and permissions
      const { userId } = req; // Assuming userId is in the request

      const [userPermissions] = await Promise.all([
        getUserRolesAndPermissions(userId.toString()), // Convert to string
      ]);

      console.log(userPermissions, "-------userPermissions");
      // Check permissions
      const isAdminOrSuperAdmin = userPermissions.roles.some((role) =>
        ["SUPER_ADMIN", "ADMIN"].includes(role)
      );

      const hasPermissionViewPermission =
        userPermissions.permissions.includes("USER_VIEW");

      // Authorization
      if (!hasPermissionViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let users;
      if (isAdminOrSuperAdmin) {
        users = await User.find().select("-__v").sort({ updatedAt: -1 });
      } else {
        res.status(HttpStatusCodes.OK).json({});
      }
      res.status(HttpStatusCodes.OK).json(users);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "roles!"}`,
      });
    }
  },

  async getUserById(req: Request, res: Response) {
    const id = req.params.roleId.toString();
    try {
      const user = await User.findOne({
        _id: id,
      }).select("-__v");
      res.json(user);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "user!"}`,
      });
    }
  },

  async updateUserById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const { userId } = req.params;
    const { email, firstName, lastName, username, password } = req.body;

    try {
      // Check if the user exists in the database
      let existingUser = await User.findById(userId).session(session);
      if (!existingUser) {
        await session.abortTransaction();

        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: `User ${ErrorMessages.NOT_FOUND}` });
      }

      // Check for unique fields (slug and name) if they are being updated
      if (email || username) {
        const conditions = [];

        if (email) {
          conditions.push({ email });
        }
        if (username) {
          conditions.push({ username });
        }
        // Check if the new slug or name already exists in the database for other records
        const duplicateUser = await User.findOne(
          {
            _id: { $ne: userId },
            $or: conditions, // Ensured valid conditions only
            isDelete: false, // Ensure it's not a deleted permission
          },
          null,
          { session }
        );

        if (duplicateUser) {
          const existingFields = [];
          if (duplicateUser.email === email) existingFields.push("email");
          if (duplicateUser.username === username)
            existingFields.push("username");

          await session.abortTransaction();
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: `${
              ErrorMessages.FIELDS_ALREADY_EXISTS
            } for another user: ${existingFields.join(", ")}`,
          });
        }
      }

      // Update the user details
      const updatedData: any = {
        email: email ? email : existingUser.email,
        firstName: firstName ? firstName : existingUser.firstName,
        lastName: lastName ? lastName : existingUser.lastName,
        username: username ? username : existingUser?.username,
        updatedBy: req.userId,
      };

      // Only update the password if it is provided and non-empty
      if (password && password.trim() !== "") {
        updatedData.password = password;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        session,
        new: true,
      })
        .select("-__v")
        .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order;

      // Commit the transaction
      await session.commitTransaction();

      if (updatedUser) {
        return res.status(HttpStatusCodes.OK).json({
          message: `User ${Messages.UPDATE_SUCCESS}`,
          data: updatedUser,
        });
      }
    } catch (error) {
      await session.abortTransaction();

      console.error("Error updating user:", error);
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: `${ErrorMessages.SERVER_ERROR}` });
    } finally {
      session.endSession(); // Ensures session cleanup
    }
  },

  async softDeleteUserById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { userId } = req.params;
      // Find the user and mark it as deleted (soft delete)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedUser) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `User not found with ID: ${userId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `User ${Messages.MARKED_AS_DELETED}`,
        data: updatedUser,
      });
    } catch (error) {
      await session.abortTransaction();
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }
  },

  async activateUserById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { userId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedUser) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `User not found with ID: ${userId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `User ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedUser,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating user:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `User ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deleteUserById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { userId } = req.params;

      const userRoles = await UserRole.findOne({ userId });

      if (userRoles) {
        return res.status(HttpStatusCodes.CONFLICT).json({
          message: "User cannot be deleted as it has associated Roles!",
        });
      }

      const user = await User.findOneAndDelete(
        {
          _id: userId,
          isDelete: true,
        },
        { session }
      );

      if (!user) {
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }
      // Commit the transaction after successful deletion
      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `User ${Messages.DELETE_SUCCESS}`,
        data: user,
      });
    } catch (error) {
      await session.abortTransaction();

      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ErrorMessages.SERVER_ERROR });
    } finally {
      session.endSession();
    }
  },
};
