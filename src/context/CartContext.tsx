import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  syncCartToDatabase,
  fetchCartFromDatabase,
  addToCartDB,
  removeFromCartDB,
  clearCartDB,
  updateCartQuantityDB,
  updateCartCouponDB,
} from "../api/cart";
import {
  syncWishlistToDatabase,
  fetchWishlistFromDatabase,
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

  // Cart-level coupon — applies to the entire cart, not per-item
  cartLevelCouponId: number | null;
  setCartLevelCouponId: (id: number | null) => void;

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
  loadFromDatabase: () => Promise<void>;
  resetSession: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Initialized from localStorage so the coupon survives navigation between the Cart page and the Checkout page
  const [cartLevelCouponId, setCartLevelCouponIdState] = useState<
    number | null
  >(() => {
    try {
      const stored = localStorage.getItem("cartLevelCouponId");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Returns true when a JWT token exists — used to decide whether to sync with the DB
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Hydrates cart and wishlist from localStorage on mount (guest and returning users)
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

  // Keeps localStorage in sync whenever cart changes;
  // clears the cart-level coupon automatically when the cart becomes empty
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } else {
      localStorage.removeItem("cart");
      setCartLevelCouponId(null);
    }
  }, [cartItems]);

  // Keeps localStorage in sync whenever wishlist changes
  useEffect(() => {
    if (wishlistItems.length > 0) {
      localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
    } else {
      localStorage.removeItem("wishlist");
    }
  }, [wishlistItems]);

  // ============================================================================
  // CART-LEVEL COUPON
  // ============================================================================

  // Updates state AND persists to localStorage so the coupon survives page refreshes
  const setCartLevelCouponId = (id: number | null) => {
    setCartLevelCouponIdState(id);
    if (id === null) {
      localStorage.removeItem("cartLevelCouponId");
    } else {
      localStorage.setItem("cartLevelCouponId", JSON.stringify(id));
    }
  };

  // ============================================================================
  // DATABASE SYNC
  // ============================================================================

  // Pushes the current localStorage cart and wishlist to the database after login,
  // merging guest session data into the authenticated user's stored data
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
    } catch (error) {
      console.error("Error syncing to database:", error);
    }
  };

  // Replaces local cart and wishlist state with the database version after login
  // The backend validates coupons — expired or inactive ones are returned as null
  const loadFromDatabase = async () => {
    try {
      const [cartData, wishlistData] = await Promise.all([
        fetchCartFromDatabase(),
        fetchWishlistFromDatabase(),
      ]);

      // Parse price and quantity — API returns them as strings
      const loadedCartItems: CartItem[] = cartData.map((item: any) => ({
        ...item,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity, 10),
        addedAt: Date.now(),
      }));

      const loadedWishlistItems: WishlistItem[] = wishlistData.map(
        (item: any) => ({
          ...item,
          price: parseFloat(item.price),
          addedAt: Date.now(),
        }),
      );

      setCartItems(loadedCartItems);
      setWishlistItems(loadedWishlistItems);

      console.log("Cart and wishlist loaded from database");
    } catch (error) {
      console.error("Error loading from database:", error);
    }
  };

  // ============================================================================
  // CART ACTIONS
  // ============================================================================

  // Adds a new item to the cart, or updates addedAt and the coupon if it already exists
  // Returns true if the item was newly added (used by the mini cart to show "added" vs "updated")
  const addToCart = (
    item: Omit<CartItem, "quantity" | "addedAt">,
    selectedCouponId?: number | null,
  ): boolean => {
    let isNewItem = false;

    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.variant_id === item.variant_id);
      if (existingItem) {
        // Item already in cart — refresh timestamp and update coupon if provided
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

    // Fire-and-forget DB sync — errors are logged but don't block the UI
    if (isAuthenticated()) {
      addToCartDB(item.variant_id, 1, selectedCouponId).catch((err) =>
        console.error("Failed to sync cart to database:", err),
      );
    }

    return isNewItem;
  };

  // Removes the item from local state and syncs the removal to the DB if authenticated
  const removeFromCart = (variantId: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.variant_id !== variantId),
    );

    if (isAuthenticated()) {
      removeFromCartDB(variantId).catch((err) =>
        console.error("Failed to sync cart removal to database:", err),
      );
    }
  };

  // Removes the item if quantity drops to 0 or below; otherwise updates quantity in state and DB
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

    if (isAuthenticated()) {
      updateCartQuantityDB(variantId, quantity).catch((err) =>
        console.error("Failed to sync cart quantity to database:", err),
      );
    }
  };

  // Updates the coupon on a cart item AND the matching wishlist item (if it exists),
  // then syncs both to the database so they stay in agreement
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

    // Keep wishlist coupon in sync with the cart coupon for the same variant
    setWishlistItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, selected_coupon_id: selectedCouponId }
          : item,
      ),
    );

    if (isAuthenticated()) {
      updateCartCouponDB(variantId, selectedCouponId).catch((err) =>
        console.error("Failed to update cart coupon in database:", err),
      );

      // Also sync the wishlist DB record if this variant is wishlisted
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

  // Empties the cart, clears the cart-level coupon, and syncs to the DB if authenticated
  const clearCart = () => {
    setCartItems([]);
    setCartLevelCouponId(null);

    if (isAuthenticated()) {
      clearCartDB().catch((err) =>
        console.error("Failed to clear cart in database:", err),
      );
    }
  };

  // ============================================================================
  // WISHLIST ACTIONS
  // ============================================================================

  // Toggles the item in the wishlist — adds it if not present, removes it if already there
  const addToWishlist = (
    item: Omit<WishlistItem, "addedAt">,
    selectedCouponId?: number | null,
  ) => {
    setWishlistItems((prev) => {
      const exists = prev.find((i) => i.variant_id === item.variant_id);
      if (exists) {
        // Already wishlisted — remove it
        if (isAuthenticated()) {
          removeFromWishlistDB(item.variant_id).catch((err) =>
            console.error("Failed to sync wishlist removal to database:", err),
          );
        }
        return prev.filter((i) => i.variant_id !== item.variant_id);
      } else {
        // Not yet wishlisted — add it to the front of the list
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

  // Updates the coupon on a wishlist item and syncs to the DB
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

    if (isAuthenticated()) {
      addToWishlistDB(variantId, selectedCouponId).catch((err) =>
        console.error("Failed to update wishlist coupon in database:", err),
      );
    }
  };

  // Removes the item from the wishlist and syncs the removal to the DB if authenticated
  const removeFromWishlist = (variantId: number) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.variant_id !== variantId),
    );

    if (isAuthenticated()) {
      removeFromWishlistDB(variantId).catch((err) =>
        console.error("Failed to sync wishlist removal to database:", err),
      );
    }
  };

  // ============================================================================
  // READ-ONLY HELPERS
  // ============================================================================

  const isInWishlist = (variantId: number) =>
    wishlistItems.some((item) => item.variant_id === variantId);

  const isInCart = (variantId: number) =>
    cartItems.some((item) => item.variant_id === variantId);

  // Sum of (price × quantity) across all cart items — does not include discounts
  const getCartTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Total number of individual units in the cart (not just unique items)
  const getCartCount = () =>
    cartItems.reduce((count, item) => count + item.quantity, 0);

  // ============================================================================
  // SESSION RESET
  // ============================================================================

  // Clears all cart, wishlist, and coupon data from both state and localStorage on logout,
  // so no authenticated user's data bleeds into a subsequent guest session
  const resetSession = () => {
    setCartItems([]);
    setWishlistItems([]);
    setCartLevelCouponIdState(null);
    localStorage.removeItem("cart");
    localStorage.removeItem("wishlist");
    localStorage.removeItem("cartLevelCouponId");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
        cartLevelCouponId,
        setCartLevelCouponId,
        addToWishlist,
        updateWishlistCoupon,
        removeFromWishlist,
        isInWishlist,
        getCartTotal,
        getCartCount,
        isInCart,
        syncToDatabase,
        loadFromDatabase,
        resetSession,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Throws if used outside of CartProvider to surface misconfigured component trees early
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
