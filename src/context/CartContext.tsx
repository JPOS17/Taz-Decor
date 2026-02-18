import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  syncCartToDatabase,
  addToCartDB,
  removeFromCartDB,
  clearCartDB,
  updateCartQuantityDB,
  updateCartCouponDB,
} from "../api/cart";
import {
  syncWishlistToDatabase,
  addToWishlistDB,
  removeFromWishlistDB,
} from "../api/wishlist";

export interface WishlistItem {
  variant_id: number;
  product_id: number;
  category_id: number;
  product_type_id?: number | null;
  name: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  category: string;
  addedAt: number;
  selected_coupon_id?: number | null;
}

export interface CartItem extends WishlistItem {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];

  addToCart: (
    item: Omit<CartItem, "quantity" | "addedAt">,
    selectedCouponId?: number | null,
  ) => boolean;
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  updateCartCoupon: (
    variantId: number,
    selectedCouponId: number | null,
  ) => void;
  clearCart: () => void;

  addToWishlist: (
    item: Omit<WishlistItem, "addedAt">,
    selectedCouponId?: number | null,
  ) => void;
  updateWishlistCoupon: (
    variantId: number,
    selectedCouponId: number | null,
  ) => void;
  removeFromWishlist: (variantId: number) => void;
  isInWishlist: (variantId: number) => boolean;

  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (variantId: number) => boolean;

  syncToDatabase: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedWishlist = localStorage.getItem("wishlist");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart:", error);
        localStorage.removeItem("cart");
      }
    }

    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Error loading wishlist:", error);
        localStorage.removeItem("wishlist");
      }
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } else {
      localStorage.removeItem("cart");
    }
  }, [cartItems]);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (wishlistItems.length > 0) {
      localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
    } else {
      localStorage.removeItem("wishlist");
    }
  }, [wishlistItems]);

  // Sync localStorage to database after login
  const syncToDatabase = async () => {
    try {
      const cartData = cartItems.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        selected_coupon_id: item.selected_coupon_id,
      }));

      const wishlistData = wishlistItems.map((item) => ({
        variant_id: item.variant_id,
        selected_coupon_id: item.selected_coupon_id,
      }));

      await syncCartToDatabase(cartData);
      await syncWishlistToDatabase(wishlistData);

      console.log("Cart and wishlist synced to database");
    } catch (error) {
      console.error("Error syncing to database:", error);
    }
  };

  const addToCart = (
    item: Omit<CartItem, "quantity" | "addedAt">,
    selectedCouponId?: number | null,
  ): boolean => {
    let isNewItem = false;

    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.variant_id === item.variant_id);
      if (existingItem) {
        // Item already in cart - update the addedAt timestamp and coupon
        return prev.map((i) =>
          i.variant_id === item.variant_id
            ? {
                ...i,
                addedAt: Date.now(),
                selected_coupon_id:
                  selectedCouponId !== undefined
                    ? selectedCouponId
                    : i.selected_coupon_id,
              }
            : i,
        );
      } else {
        isNewItem = true;
        return [
          ...prev,
          {
            ...item,
            quantity: 1,
            addedAt: Date.now(),
            selected_coupon_id: selectedCouponId,
          },
        ];
      }
    });

    // Sync to database if authenticated
    if (isAuthenticated()) {
      addToCartDB(item.variant_id, 1, selectedCouponId).catch((err) =>
        console.error("Failed to sync cart to database:", err),
      );
    }

    return isNewItem;
  };

  const removeFromCart = (variantId: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.variant_id !== variantId),
    );

    // Sync to database if authenticated
    if (isAuthenticated()) {
      removeFromCartDB(variantId).catch((err) =>
        console.error("Failed to sync cart removal to database:", err),
      );
    }
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId ? { ...item, quantity } : item,
      ),
    );

    // Sync to database if authenticated
    if (isAuthenticated()) {
      updateCartQuantityDB(variantId, quantity).catch((err) =>
        console.error("Failed to sync cart quantity to database:", err),
      );
    }
  };

  const updateCartCoupon = (
    variantId: number,
    selectedCouponId: number | null,
  ) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, selected_coupon_id: selectedCouponId }
          : item,
      ),
    );

    // ALSO update the wishlist item if it exists
    setWishlistItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, selected_coupon_id: selectedCouponId }
          : item,
      ),
    );

    // Sync to database if authenticated
    if (isAuthenticated()) {
      updateCartCouponDB(variantId, selectedCouponId).catch((err) =>
        console.error("Failed to update cart coupon in database:", err),
      );

      // Also update wishlist in database if item is in wishlist
      const isInWishlistCheck = wishlistItems.some(
        (item) => item.variant_id === variantId,
      );
      if (isInWishlistCheck) {
        addToWishlistDB(variantId, selectedCouponId).catch((err) =>
          console.error("Failed to sync wishlist coupon in database:", err),
        );
      }
    }
  };

  const clearCart = () => {
    setCartItems([]);

    // Sync to database if authenticated
    if (isAuthenticated()) {
      clearCartDB().catch((err) =>
        console.error("Failed to clear cart in database:", err),
      );
    }
  };

  const addToWishlist = (
    item: Omit<WishlistItem, "addedAt">,
    selectedCouponId?: number | null,
  ) => {
    setWishlistItems((prev) => {
      const exists = prev.find((i) => i.variant_id === item.variant_id);
      if (exists) {
        // Remove from wishlist
        if (isAuthenticated()) {
          removeFromWishlistDB(item.variant_id).catch((err) =>
            console.error("Failed to sync wishlist removal to database:", err),
          );
        }
        return prev.filter((i) => i.variant_id !== item.variant_id);
      } else {
        // Add to wishlist
        if (isAuthenticated()) {
          addToWishlistDB(item.variant_id, selectedCouponId).catch((err) =>
            console.error("Failed to sync wishlist to database:", err),
          );
        }
        return [
          {
            ...item,
            selected_coupon_id: selectedCouponId,
            addedAt: Date.now(),
          },
          ...prev,
        ];
      }
    });
  };

  const updateWishlistCoupon = (
    variantId: number,
    selectedCouponId: number | null,
  ) => {
    setWishlistItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, selected_coupon_id: selectedCouponId }
          : item,
      ),
    );

    // Sync to database if authenticated
    if (isAuthenticated()) {
      addToWishlistDB(variantId, selectedCouponId).catch((err) =>
        console.error("Failed to update wishlist coupon in database:", err),
      );
    }
  };

  const removeFromWishlist = (variantId: number) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.variant_id !== variantId),
    );

    // Sync to database if authenticated
    if (isAuthenticated()) {
      removeFromWishlistDB(variantId).catch((err) =>
        console.error("Failed to sync wishlist removal to database:", err),
      );
    }
  };

  const isInWishlist = (variantId: number) => {
    return wishlistItems.some((item) => item.variant_id === variantId);
  };

  const isInCart = (variantId: number) => {
    return cartItems.some((item) => item.variant_id === variantId);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartCoupon,
        clearCart,
        addToWishlist,
        updateWishlistCoupon,
        removeFromWishlist,
        isInWishlist,
        getCartTotal,
        getCartCount,
        isInCart,
        syncToDatabase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
