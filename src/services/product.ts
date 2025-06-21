import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { HttpStatusCodes } from "../constants/http_status_codes";
import { ErrorMessages, Messages } from "../constants/messages";
import {
  capitalizeFirstLetter,
  convertToUnderscoreUpperCase,
} from "../utils/convert_text_utils";
import mongoose from "mongoose";
import Product from "../models/product";
import { getUserRolesAndPermissions } from "../utils/auth_utils";
import { getClientIdByEmail } from "../utils/client_utils";
import { deleteFile, deleteFiles } from "../utils/file_handler_utils";

export const ProductServices = {
  // create
  // async createProduct(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const {
  //     clientId,
  //     title,
  //     // types,
  //     quantity,
  //     unit,
  //     costPrice,
  //     price,
  //     description,
  //   } = req.body;
  //   const files = req.files as Express.Multer.File[];
  //   // Handle types from form data - already processed by middleware
  //   const types = req.body.types || [];

  //   const session = await mongoose.startSession();

  //   try {
  //     // Start the transaction
  //     session.startTransaction();

  //     const existingProduct = await Product.findOne(
  //       {
  //         $or: [{ clientId: clientId, title: capitalizeFirstLetter(title) }],
  //         isDelete: false,
  //       },
  //       null,
  //       { session }
  //     );

  //     if (existingProduct) {
  //       await session.abortTransaction();
  //       await session.endSession();
  //       return res
  //         .status(HttpStatusCodes.BAD_REQUEST)
  //         .json({ message: `Product ${ErrorMessages.ALREADY_EXISTS}` });
  //     }

  //     // Process uploaded files
  //     const imagePaths = files.map((file) => {
  //       return file.filename; // or your preferred storage path
  //     });

  //     // Create a new Product
  //     const product = new Product({
  //       clientId: clientId,
  //       title: capitalizeFirstLetter(title),
  //       types: types,
  //       quantity: quantity,
  //       unit: unit,
  //       costPrice: costPrice,
  //       price: price,
  //       images: imagePaths,
  //       description: description,
  //       createdBy: req.userId,
  //     });

  //     await product.save({ session });

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.CREATED).json({
  //       message: `Product ${Messages.CREATE_SUCCESS}`,
  //       data: product,
  //     });
  //   } catch (error) {
  //     // Only abort if transaction was started
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }
  //     console.error("Error creating product:", error);
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: ErrorMessages.SERVER_ERROR });
  //   } finally {
  //     // End session regardless of success/failure
  //     await session.endSession();
  //   }
  // },

  async createProduct(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
  
    const {
      clientId,
      name,
      category,
      description,
      types,
      unit,
      minOrder,
      quantity,
    } = req.body;
    
    const files = req.files as Express.Multer.File[];
    const session = await mongoose.startSession();
  
    try {
      session.startTransaction();
  
      // Check for existing product
      const existingProduct = await Product.findOne({
        clientId,
        name: capitalizeFirstLetter(name),
        isDelete: false
      }).session(session);
  
      if (existingProduct) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: `Product ${ErrorMessages.ALREADY_EXISTS}`
        });
      }
  
      // Process images
      const imagePaths = files.map(file => file.filename);
  
      // Create new product
      const product = new Product({
        clientId,
        name: capitalizeFirstLetter(name),
        category,
        description,
        types: types || [],
        unit,
        minOrder,
        quantity,
        images: imagePaths,
        createdBy: req.userId
      });
  
      await product.save({ session });
      await session.commitTransaction();
  
      return res.status(HttpStatusCodes.CREATED).json({
        message: `Product ${Messages.CREATE_SUCCESS}`,
        data: product
      });
  
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("Error creating product:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR
      });
    } finally {
      await session.endSession();
    }
  },

  async getAllProducts(req: Request, res: Response) {
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

      const hasProductViewPermission =
        userPermissions.permissions.includes("PRODUCT_VIEW");

      const isClientRole = userPermissions.roles.includes("CLIENT");
      console.log(
        hasProductViewPermission,
        "---------hasProductViewPermission"
      );

      // Authorization
      if (!hasProductViewPermission) {
        return res.status(HttpStatusCodes.FORBIDDEN).json({
          message: ErrorMessages.PERMISSION_DENIED,
        });
      }

      // Data fetching based on role
      let products;
      if (isAdminOrSuperAdmin) {
        products = await Product.find().select("-__v").sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else if (isClientRole && clientId) {
        products = await Product.find({ clientId: clientId })
          .select("-__v")
          .sort({ updatedAt: -1 }); // Sort by lastUpdated in descending order
      } else {
        // Other roles with CLIENT_VIEW see all (or implement custom logic)
        // abouts = await About.find().select("-__v").sort({ updatedAt: -1 });
        res.status(HttpStatusCodes.OK).json({});
      }
      res.status(HttpStatusCodes.OK).json(products);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "products!"}`,
      });
    }
  },

  async getProductById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }

    const id = req.params.productId.toString();
    try {
      const product = await Product.findOne({
        _id: id,
      }).select("-__v");
      res.json(product);
    } catch (error) {
      res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `${ErrorMessages.FETCHING_ERROR + " " + "productId!"}`,
      });
    }
  },

  // async updateProductById(req: Request, res: Response) {
  //   const errors = validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //       message: errors.array(),
  //     });
  //   }

  //   const { productId } = req.params;
  //   const {
  //     clientId,
  //     title,
  //     // types,
  //     quantity,
  //     unit,
  //     costPrice,
  //     price,
  //     description,
  //   } = req.body;
  //   const files = req.files as Express.Multer.File[];
  //   // Handle types from form data - already processed by middleware
  //   const types = req.body.types || undefined; // Let schema handle if undefined

  //   // Parse existing images from the request
  //   let existingImagePaths: string[] = [];
  //   try {
  //     if (req.body.existingImages) {
  //       existingImagePaths = JSON.parse(req.body.existingImages);
  //     }
  //   } catch (e) {
  //     console.error("Error parsing existingImages:", e);
  //   }

  //   const session = await mongoose.startSession();

  //   try {
  //     session.startTransaction();

  //     // Check if product exists and is not deleted
  //     const existingProduct = await Product.findById(productId).session(
  //       session
  //     );
  //     if (!existingProduct || existingProduct.isDelete) {
  //       await session.abortTransaction();
  //       return res.status(HttpStatusCodes.NOT_FOUND).json({
  //         message: `Product ${ErrorMessages.NOT_FOUND}`,
  //       });
  //     }

  //     // Validate title uniqueness if being updated
  //     if (title) {
  //       const query = {
  //         _id: { $ne: productId },
  //         clientId: clientId || existingProduct.clientId,
  //         title: capitalizeFirstLetter(title),
  //         isDelete: false,
  //       };

  //       const duplicateProduct = await Product.findOne(query).session(session);
  //       if (duplicateProduct) {
  //         await session.abortTransaction();
  //         return res.status(HttpStatusCodes.BAD_REQUEST).json({
  //           message: `Product title "${title}" ${ErrorMessages.ALREADY_EXISTS} for this client`,
  //         });
  //       }
  //     }

  //     // Handle file updates
  //     let finalImagePaths = existingImagePaths;

  //     // Add newly uploaded files
  //     if (files && files.length > 0) {
  //       finalImagePaths = [
  //         ...finalImagePaths,
  //         ...files.map((file) => file.filename),
  //       ];
  //     }

  //     // Find and delete images that were removed
  //     const removedImages = existingProduct.images.filter(
  //       (img) => !finalImagePaths.includes(img)
  //     );

  //     if (removedImages.length > 0) {
  //       await deleteFiles("product", removedImages);
  //     }

  //     // Prepare updated data
  //     const updatedData = {
  //       clientId: clientId || existingProduct.clientId,
  //       title: title ? capitalizeFirstLetter(title) : existingProduct.title,
  //       types: types ? types : existingProduct.types,
  //       // quantity: quantity ? quantity : existingProduct.quantity,
  //       unit: unit ? unit : existingProduct.unit,
  //       // costPrice: costPrice ? costPrice : existingProduct.costPrice,
  //       price: price ? price : existingProduct.price,
  //       images: finalImagePaths,
  //       description: description || existingProduct.description,
  //       updatedBy: req.userId,
  //       updatedAt: new Date(),
  //     };

  //     // Perform the update
  //     const updatedProduct = await Product.findByIdAndUpdate(
  //       productId,
  //       updatedData,
  //       { new: true, session }
  //     ).select("-__v");

  //     await session.commitTransaction();

  //     return res.status(HttpStatusCodes.OK).json({
  //       message: `Product ${Messages.UPDATE_SUCCESS}`,
  //       data: updatedProduct,
  //     });
  //   } catch (error) {
  //     if (session.inTransaction()) {
  //       await session.abortTransaction();
  //     }
  //     console.error("Error updating product:", error);
  //     return res
  //       .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
  //       .json({ message: ErrorMessages.SERVER_ERROR });
  //   } finally {
  //     await session.endSession();
  //   }
  // },

  async updateProductById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
  
    const { productId } = req.params;
    const {
      name,
      category,
      description,
      types,
      unit,
      minOrder,
      quantity
    } = req.body;
  
    const files = req.files as Express.Multer.File[];
    let existingImagePaths: string[] = [];
  
    try {
      if (req.body.existingImages) {
        existingImagePaths = JSON.parse(req.body.existingImages);
      }
    } catch (e) {
      console.error("Error parsing existingImages:", e);
    }
  
    const session = await mongoose.startSession();
  
    try {
      session.startTransaction();
  
      const existingProduct = await Product.findById(productId).session(session);
      if (!existingProduct || existingProduct.isDelete) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Product ${ErrorMessages.NOT_FOUND}`
        });
      }
  
      // Check for duplicate name
      if (name) {
        const duplicate = await Product.findOne({
          _id: { $ne: productId },
          clientId: existingProduct.clientId,
          name: capitalizeFirstLetter(name),
          isDelete: false
        }).session(session);
  
        if (duplicate) {
          await session.abortTransaction();
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            message: `Product name "${name}" ${ErrorMessages.ALREADY_EXISTS}`
          });
        }
      }
  
      // Handle image updates
      let finalImagePaths = existingImagePaths;
      if (files?.length > 0) {
        finalImagePaths = [...finalImagePaths, ...files.map(file => file.filename)];
      }
  
      // Remove deleted images
      const removedImages = existingProduct.images.filter(
        img => !finalImagePaths.includes(img)
      );
      if (removedImages.length > 0) {
        await deleteFiles("product", removedImages);
      }
  
      // Prepare update data
      const updateData = {
        name: name ? capitalizeFirstLetter(name) : existingProduct.name,
        category: category || existingProduct.category,
        description: description || existingProduct.description,
        types: types || existingProduct.types,
        unit: unit || existingProduct.unit,
        minOrder: minOrder || existingProduct.minOrder,
        quantity: quantity || existingProduct.quantity,
        images: finalImagePaths,
        updatedBy: req.userId
      };
  
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, session }
      );
  
      await session.commitTransaction();
  
      return res.status(HttpStatusCodes.OK).json({
        message: `Product ${Messages.UPDATE_SUCCESS}`,
        data: updatedProduct
      });
  
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("Error updating product:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessages.SERVER_ERROR
      });
    } finally {
      await session.endSession();
    }
  },
  
  async softDeleteProductById(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { productId } = req.params;
      // Find the gallery and mark it as deleted (soft delete)
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { isDelete: true, deletedAt: new Date() },
        { new: true, session }
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Product not found with ID: ${productId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Product ${Messages.MARKED_AS_DELETED}`,
        data: updatedProduct,
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

  async activateProductById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { productId } = req.params;
      // Find the category and mark it as active (undo soft delete)
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { isDelete: false, deletedAt: null },
        { new: true, session }
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res.status(HttpStatusCodes.NOT_FOUND).json({
          message: `Product not found with ID: ${productId}`,
        });
      }

      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Product ${Messages.ACTIVATE_SUCCESS}`,
        data: updatedProduct,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error activating product:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        message: `Product ${ErrorMessages?.ACTIVATE_FAILED}`,
      });
    } finally {
      session.endSession();
    }
  },

  async deleteProductById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        message: errors.array(),
      });
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId } = req.params;

      const product = await Product.findOneAndDelete(
        { _id: productId, isDelete: true },
        { session }
      );

      if (!product) {
        await session.abortTransaction();
        return res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ message: ErrorMessages.NOT_FOUND });
      }

      // Delete associated images
      if (product.images && product.images.length > 0) {
        const deleteFilesSafely = async (files: string | string[]) => {
          const filesArray = Array.isArray(files) ? files : [files];
          for (const file of filesArray) {
            try {
              if (file) {
                await deleteFile("product", file);
              }
            } catch (err) {
              console.error(`Error deleting file ${file}:`, err);
              // Continue with other files even if one fails
            }
          }
        };

        await deleteFilesSafely(product.images);
      }

      // Commit the transaction after successful deletion
      await session.commitTransaction();
      return res.status(HttpStatusCodes.OK).json({
        message: `Product ${Messages.DELETE_SUCCESS}`,
        data: product,
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
