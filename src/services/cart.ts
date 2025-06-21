// services/cartService.ts
import Cart, { CartItemType, CartType } from "../models/cart";
import Product from "../models/product";

class CartService {
  // Get or create user's cart
  // Get or create cart (works for both guest and authenticated)
  async getOrCreateCart(
    identifier: { userId?: string; sessionId?: string },
    clientId: string
  ): Promise<CartType> {
    if (!identifier.userId && !identifier.sessionId) {
      throw new Error("Either userId or sessionId required");
    }

    const query = { clientId };
    if (identifier.userId) query.userId = identifier.userId;
    if (identifier.sessionId) query.sessionId = identifier.sessionId;

    let cart = await Cart.findOne(query)
      .populate("items.productId", "title price images unit")
      .exec();

    if (!cart) {
      cart = await Cart.create({
        ...query,
        items: [],
      });
    }

    return cart;
  }

  // Merge guest cart with user cart on login
  async mergeCarts(
    userId: string,
    sessionId: string,
    clientId: string
  ): Promise<CartType> {
    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ sessionId, clientId }),
      Cart.findOne({ userId, clientId }),
    ]);

    if (!guestCart)
      return userCart || this.getOrCreateCart({ userId }, clientId);

    // If no user cart exists, just convert guest to user cart
    if (!userCart) {
      return Cart.findByIdAndUpdate(
        guestCart._id,
        { $set: { userId, sessionId: null } },
        { new: true }
      ).populate("items.productId", "title price images unit");
    }

    // Merge items from guest cart to user cart
    const mergedItems = [...userCart.items];

    guestCart.items.forEach((guestItem) => {
      const existingIndex = mergedItems.findIndex(
        (item) => item.productId.toString() === guestItem.productId.toString()
      );

      if (existingIndex >= 0) {
        // Merge quantities if same product
        mergedItems[existingIndex].quantity += guestItem.quantity;
      } else {
        // Add new item
        mergedItems.push(guestItem);
      }
    });

    // Update user cart and delete guest cart
    const [updatedCart] = await Promise.all([
      Cart.findByIdAndUpdate(
        userCart._id,
        { $set: { items: mergedItems } },
        { new: true }
      ).populate("items.productId", "title price images unit"),
      Cart.deleteOne({ _id: guestCart._id }),
    ]);

    return updatedCart!;
  }

  // Add item to cart
  async addToCart(
    userId: string,
    clientId: string,
    productId: string,
    quantity: number,
    selectedTypes?: string[]
  ): Promise<CartType> {
    // Get product
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");
    if (product.quantity < quantity) throw new Error("Insufficient stock");

    // Get or create cart
    const cart = await this.getOrCreateCart(userId, clientId);

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      if (selectedTypes) {
        cart.items[existingItemIndex].selectedTypes = [
          ...new Set([
            ...(cart.items[existingItemIndex].selectedTypes || []),
            ...selectedTypes,
          ]),
        ];
      }
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        selectedTypes,
        price: product.price,
        addedAt: new Date(),
      });
    }

    await cart.save();
    return cart.populate("items.productId", "title price images unit");
  }

  // Update cart item
  async updateCartItem(
    userId: string,
    clientId: string,
    productId: string,
    updates: Partial<CartItemType>
  ): Promise<CartType> {
    const cart = await Cart.findOne({ userId, clientId });
    if (!cart) throw new Error("Cart not found");

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) throw new Error("Item not found in cart");

    // Validate quantity against product stock
    if (updates.quantity) {
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");
      if (product.quantity < updates.quantity)
        throw new Error("Insufficient stock");
    }

    // Update item
    cart.items[itemIndex] = {
      ...cart.items[itemIndex],
      ...updates,
      productId: cart.items[itemIndex].productId, // Ensure productId isn't overwritten
    };

    await cart.save();
    return cart.populate("items.productId", "title price images unit");
  }

  // Remove item from cart
  async removeFromCart(
    userId: string,
    clientId: string,
    productId: string
  ): Promise<CartType> {
    const cart = await Cart.findOne({ userId, clientId });
    if (!cart) throw new Error("Cart not found");

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    return cart.populate("items.productId", "title price images unit");
  }

  // Clear cart
  async clearCart(userId: string, clientId: string): Promise<CartType> {
    const cart = await Cart.findOneAndUpdate(
      { userId, clientId },
      { $set: { items: [] } },
      { new: true }
    ).populate("items.productId", "title price images unit");

    if (!cart) throw new Error("Cart not found");
    return cart;
  }
}

export default new CartService();
