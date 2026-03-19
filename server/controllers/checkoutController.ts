import { Request, Response } from "express";
import { getUserFromToken } from "../middleware/authMiddleware";
import { pool } from "../db";
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from "../utils/emailService";
import { selectShippingBox, getShippingBoxById } from "../utils/boxPackingService";
import { getRealTimeShippingRates, validateAddress } from "../utils/shippoService";
import type { BoxDimensions } from "../utils/shippoService";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to log order status changes
 */
const logOrderStatus = async (
  client: any,
  orderId: number,
  newStatus: string,
  notes?: string
) => {
  await client.query(
    `INSERT INTO order_status_logs (order_id, status, notes)
     VALUES ($1, $2, $3)`,
    [orderId, newStatus, notes || null]
  );
};

// ============================================================================
// ADDRESS MANAGEMENT
// ============================================================================

/**
 * VALIDATE address using Shippo 
 */
export const validateAddressEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const {
      address_name,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country
    } = req.body;

    // Only validate U.S. addresses 
    if (country && country !== "US" && country !== "USA") {
       res.status(400).json({ 
        message: "Address validation is only available for U.S. addresses" 
      });
      return
    }

    // Call Shippo validation
    const validationResult = await validateAddress({
      name: address_name,
      street1: address_line1,
      street2: address_line2,
      city,
      state,
      zip,
      country: "US"
    });

    res.json(validationResult);

  } catch (error: any) {
    console.error("Error validating address:", error);
    res.status(500).json({ 
      message: error.message || "Failed to validate address" 
    });
  }
};

// ============================================================================
// CART VALIDATION
// ============================================================================

/**
 * VALIDATE cart items before checkout
 */
export const validateCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const variantIds = cartItems.map((item: any) => item.variant_id);

    // Check stock availability and get current prices
    const result = await pool.query(
      `SELECT 
        pv.variant_id,
        pv.price,
        pv.quantity as stock,
        pv.is_active,
        p.name
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      WHERE pv.variant_id = ANY($1)`,
      [variantIds]
    );

    interface ValidationResult {
      variant_id: number;
      valid: boolean;
      error?: string;
      available_stock?: number;
      price_changed?: boolean;
      current_price?: number;
      cart_price?: number;
    }

    const validationResults: ValidationResult[] = cartItems.map((cartItem: any) => {
      const dbItem = result.rows.find(row => row.variant_id === cartItem.variant_id);
      
      if (!dbItem) {
        return {
          variant_id: cartItem.variant_id,
          valid: false,
          error: "Product no longer available"
        };
      }

      if (!dbItem.is_active) {
        return {
          variant_id: cartItem.variant_id,
          valid: false,
          error: "Product is no longer active"
        };
      }

      if (dbItem.stock < cartItem.quantity) {
        return {
          variant_id: cartItem.variant_id,
          valid: false,
          error: `Insufficient stock. Only ${dbItem.stock} available`,
          available_stock: dbItem.stock
        };
      }

      // Check if price has changed
      const priceChanged = Math.abs(parseFloat(dbItem.price) - cartItem.price) > 0.01;
      
      return {
        variant_id: cartItem.variant_id,
        valid: true,
        price_changed: priceChanged,
        current_price: parseFloat(dbItem.price),
        cart_price: cartItem.price
      };
    });

    const allValid = validationResults.every(item => item.valid);
    const hasPriceChanges = validationResults.some(item => item.price_changed);

    res.json({
      valid: allValid,
      has_price_changes: hasPriceChanges,
      items: validationResults
    });

  } catch (error) {
    console.error("Error validating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// SHIPPING CALCULATION
// ============================================================================

/**
 * CALCULATE real-time shipping rates
 */
export const calculateShipping = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { cartItems, addressId } = req.body;

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    if (!addressId) {
      res.status(400).json({ message: "Shipping address is required" });
      return;
    }

    // Get shipping address details and user email
    const addressResult = await pool.query(
      `SELECT 
        ua.address_name,
        ua.address_line1,
        ua.address_line2,
        ua.city,
        ua.state,
        ua.zip,
        ua.country,
        u.email,
        u.first_name
      FROM user_addresses ua
      JOIN users u ON u.user_id = ua.user_id
      WHERE ua.address_id = $1 AND ua.user_id = $2`,
      [addressId, user.userId]
    );

    if (addressResult.rows.length === 0) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const address = addressResult.rows[0];

    // Get variant details including weight and dimensions
    const variantIds = cartItems.map((item: any) => item.variant_id);
    const variantsResult = await pool.query(
      `SELECT 
        variant_id,
        weight_oz,
        length_in,
        width_in,
        height_in
      FROM product_variants
      WHERE variant_id = ANY($1)`,
      [variantIds]
    );

    // Build items array with weight/dimensions for each quantity
    const items: Array<{
      weight_oz: number;
      length_in?: number;
      width_in?: number;
      height_in?: number;
    }> = [];

    // Also build packing items for box selection
    const packingItems: Array<{
      variant_id: number;
      quantity: number;
      length_in: number;
      width_in: number;
      height_in: number;
    }> = [];

    for (const cartItem of cartItems) {
      const variant = variantsResult.rows.find(
        (v) => v.variant_id === cartItem.variant_id
      );

      if (!variant) {
        res.status(400).json({
          message: `Variant ${cartItem.variant_id} not found`,
        });
        return 
      }

      // If weight is missing, use a default 
      const weightOz = variant.weight_oz || 8; 

      // Add item for each quantity 
      for (let i = 0; i < cartItem.quantity; i++) {
        items.push({
          weight_oz: parseFloat(weightOz),
          length_in: variant.length_in ? parseFloat(variant.length_in) : undefined,
          width_in: variant.width_in ? parseFloat(variant.width_in) : undefined,
          height_in: variant.height_in ? parseFloat(variant.height_in) : undefined,
        });
      }

      // Add to packing items (dimensions default to 0 for flat items like cards/stickers)
      packingItems.push({
        variant_id: cartItem.variant_id,
        quantity: cartItem.quantity,
        length_in: variant.length_in ? parseFloat(variant.length_in) : 0,
        width_in: variant.width_in ? parseFloat(variant.width_in) : 0,
        height_in: variant.height_in ? parseFloat(variant.height_in) : 0,
      });
    }

    // Get location_id from first item (assuming all items from same location)
    const firstVariantLocation = await pool.query(
      'SELECT location_id FROM product_variants WHERE variant_id = $1',
      [cartItems[0].variant_id]
    );

    if (firstVariantLocation.rows.length === 0) {
      res.status(400).json({ message: "Product location not found" });
      return;
    }

    const locationId = firstVariantLocation.rows[0].location_id;

    // Run box packing algorithm to select optimal box
    let selectedBox: BoxDimensions | undefined;
    let selectedBoxId: number | undefined;
    
    try {
      const box = await selectShippingBox(packingItems, locationId);
      if (box) {
        selectedBox = {
          length_in: parseFloat(box.length_in.toString()),
          width_in: parseFloat(box.width_in.toString()),
          height_in: parseFloat(box.height_in.toString()),
          box_name: box.box_name,
        };
        selectedBoxId = box.box_id;
        console.log(`✅ Selected box for shipping calculation: ${box.box_name} (ID: ${box.box_id})`);
      }
    } catch (boxError) {
      console.error("⚠️  Box selection failed, will use default dimensions:", boxError);
    }

    // Get real-time shipping rates from Shippo (now with selected box)
    const shippingRates = await getRealTimeShippingRates(
      items,
      {
        name: address.address_name || address.first_name,
        street1: address.address_line1,
        street2: address.address_line2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || "US",
      },
      selectedBox 
    );

    // Calculate total weight for informational purposes
    const totalWeightOz = items.reduce((sum, item) => sum + item.weight_oz, 0);
    const totalWeightLbs = totalWeightOz / 16;

    // Return shipping options to frontend (including selected box info)
    res.json({
      shipping_options: shippingRates,
      weight_lbs: parseFloat(totalWeightLbs.toFixed(2)),
      total_items: items.length,
      selected_box: selectedBox ? {
        box_id: selectedBoxId,
        box_name: selectedBox.box_name,
        dimensions: `${selectedBox.length_in}×${selectedBox.width_in}×${selectedBox.height_in}`,
      } : null,
    });

  } catch (error: any) {
    console.error("Error calculating shipping:", error);
    res.status(500).json({ 
      message: "Failed to calculate shipping", 
      error: error.message 
    });
  }
};

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

/**
 * CREATE new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const {
      shipping_address_id,
      cart_items,
      subtotal,
      item_level_discount,
      cart_level_discount,
      shipping_cost,
      tax_amount,
      total_price,
      applied_coupons,
      cart_level_coupon_id,
      shipping_carrier,
      shipping_service,
    } = req.body;

    // Validate required fields
    if (!shipping_address_id || !cart_items || cart_items.length === 0) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Calculate total discount
    const discount_amount = (item_level_discount || 0) + (cart_level_discount || 0);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify address belongs to user AND fetch its data in one shot
      const addressCheck = await client.query(
        `SELECT 
          address_id,
          address_line1,
          address_line2,
          city,
          state,
          zip,
          country
        FROM user_addresses 
        WHERE address_id = $1 AND user_id = $2`,
        [shipping_address_id, user.userId]
      );

      if (addressCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Invalid shipping address" });
        return;
      }

      const addressData = addressCheck.rows[0];

      // Fetch user's name and email for the snapshot
      const userResult = await client.query(
        'SELECT email, first_name, last_name FROM users WHERE user_id = $1',
        [user.userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "User not found" });
        return;
      }

      const { email: userEmail, first_name, last_name } = userResult.rows[0];
      
      // Helper query to validate a single coupon and return its per-user usage count
      const validateCoupon = async (couponId: number): Promise<{
        valid: boolean;
        errorMessage?: string;
      }> => {
        const couponCheck = await client.query(
          `SELECT
            c.coupon_id,
            c.is_active,
            c.valid_until,
            c.usage_limit_total,
            c.usage_count_total,
            c.usage_limit_per_user,
            COALESCE((
              SELECT COUNT(DISTINCT oc.order_id)
              FROM order_coupons oc
              JOIN orders o ON oc.order_id = o.order_id
              WHERE oc.coupon_id = c.coupon_id
                AND o.user_id = $2
            ), 0) AS user_usage_count
          FROM coupons c
          WHERE c.coupon_id = $1`,
          [couponId, user.userId]
        );

        // Check 1: coupon exists
        if (couponCheck.rows.length === 0) {
          return { valid: false, errorMessage: "One or more coupons no longer exist." };
        }

        const c = couponCheck.rows[0];

        // Check 3: still active
        if (!c.is_active) {
          return { valid: false, errorMessage: "One or more coupons are no longer active." };
        }

        // Check 2: not expired
        if (c.valid_until && new Date(c.valid_until) < new Date()) {
          return { valid: false, errorMessage: "One or more coupons have expired." };
        }

        // Check 4: total usage limit not exceeded
        if (c.usage_limit_total && c.usage_count_total >= c.usage_limit_total) {
          return { valid: false, errorMessage: "One or more coupons have reached their usage limit." };
        }

        // Check 5: per-user limit not exceeded
        if (c.usage_limit_per_user && parseInt(c.user_usage_count) >= c.usage_limit_per_user) {
          return { valid: false, errorMessage: "You've already used one or more coupons the maximum number of times." };
        }

        return { valid: true };
      };

      // Validate cart-level coupon
      if (cart_level_coupon_id) {
        const result = await validateCoupon(cart_level_coupon_id);
        if (!result.valid) {
          await client.query('ROLLBACK');
          res.status(400).json({ message: result.errorMessage });
          return;
        }
      }

      // Validate all item-level coupons (deduplicated — only check each coupon_id once)
      if (applied_coupons && applied_coupons.length > 0) {
        const seenCouponIds = new Set<number>();
        for (const appliedCoupon of applied_coupons) {
          if (seenCouponIds.has(appliedCoupon.coupon_id)) continue;
          seenCouponIds.add(appliedCoupon.coupon_id);

          const result = await validateCoupon(appliedCoupon.coupon_id);
          if (!result.valid) {
            await client.query('ROLLBACK');
            res.status(400).json({ message: result.errorMessage });
            return;
          }
        }
      }

      // ============================================================================
      // END COUPON VALIDATION
      // ============================================================================

      // Get the location_id from the first item
      const firstVariantResult = await client.query(
        'SELECT location_id FROM product_variants WHERE variant_id = $1',
        [cart_items[0].variant_id]
      );

      if (firstVariantResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Invalid product" });
        return;
      }

      const location_id = firstVariantResult.rows[0].location_id;

      // BOX SELECTION
      const variantIds = cart_items.map((item: any) => item.variant_id);
      const variantsResult = await client.query(
        `SELECT 
          variant_id,
          length_in,
          width_in,
          height_in,
          weight_oz
        FROM product_variants
        WHERE variant_id = ANY($1)`,
        [variantIds]
      );

      // Build packing items array
      const packingItems: Array<{
        variant_id: number;
        quantity: number;
        length_in: number;
        width_in: number;
        height_in: number;
      }> = cart_items.map((cartItem: any) => {
        const variant = variantsResult.rows.find(
          (v: any) => v.variant_id === cartItem.variant_id
        );
        return {
          variant_id: cartItem.variant_id,
          quantity: cartItem.quantity,
          length_in: variant?.length_in ? parseFloat(variant.length_in) : 0,
          width_in: variant?.width_in ? parseFloat(variant.width_in) : 0,
          height_in: variant?.height_in ? parseFloat(variant.height_in) : 0,
        };
      });

      // Calculate total weight
      let totalWeightOz = 0;
      for (const cartItem of cart_items) {
        const variant = variantsResult.rows.find(
          (v: any) => v.variant_id === cartItem.variant_id
        );
        const weightOz = variant?.weight_oz ? parseFloat(variant.weight_oz) : 8;
        totalWeightOz += weightOz * cartItem.quantity;
      }
      console.log(`⚖️  Order total weight: ${totalWeightOz}oz (${(totalWeightOz / 16).toFixed(2)}lbs)`);

      // Select optimal shipping box
      let selectedBoxId: number | null = null;
      try {
        const selectedBox = await selectShippingBox(packingItems, location_id);
        if (selectedBox) {
          selectedBoxId = selectedBox.box_id;
          console.log(`📦 Selected box for order: ${selectedBox.box_name} (ID: ${selectedBox.box_id})`);
        } else {
          console.warn("⚠️  No box selected, order will proceed without box assignment");
        }
      } catch (boxError) {
        console.error("❌ Box selection failed for order:", boxError);
      }

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order with address snapshot
      const orderResult = await client.query(
        `INSERT INTO orders 
        (user_id, shipping_address_id, location_id, order_number, subtotal, 
        discount_amount, item_level_discount, cart_level_discount,
        shipping_cost, tax_amount, total_price, selected_box_id, total_weight_oz,
        shipping_carrier, shipping_service,
        first_name, last_name, address_line1, address_line2, city, state, zip, country, customer_email,
        status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'pending', NOW())
        RETURNING *`,
        [
          user.userId, shipping_address_id, location_id, orderNumber, subtotal,
          discount_amount, item_level_discount || 0, cart_level_discount || 0,
          shipping_cost, tax_amount || 0, total_price, selectedBoxId, totalWeightOz,
          shipping_carrier || null, shipping_service || null,
          first_name,
          last_name,
          addressData.address_line1,
          addressData.address_line2 || null,
          addressData.city,
          addressData.state,
          addressData.zip,
          addressData.country || 'USA',
          userEmail
        ]
      );

      const order = orderResult.rows[0];

      // Log initial order status as 'pending'
      await logOrderStatus(
        client,
        order.order_id,
        'pending',
        'Order placed by customer'
      );

      // Insert order items
      for (const item of cart_items) {
        const productResult = await client.query(
          `SELECT p.name, pv.color, pv.size, pv.price
           FROM product_variants pv
           JOIN products p ON p.product_id = pv.product_id
           WHERE pv.variant_id = $1`,
          [item.variant_id]
        );

        if (productResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ message: `Invalid product variant: ${item.variant_id}` });
          return;
        }

        const product = productResult.rows[0];
        const variantDetails = [product.color, product.size].filter(Boolean).join(', ');

        await client.query(
          `INSERT INTO order_items 
          (order_id, variant_id, product_name, variant_details, quantity, price_at_purchase)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.order_id, item.variant_id, product.name, variantDetails, item.quantity, item.price]
        );

        // Decrease stock
        await client.query(
          'UPDATE product_variants SET quantity = quantity - $1 WHERE variant_id = $2',
          [item.quantity, item.variant_id]
        );
      }

      // Track item-level coupons
      if (applied_coupons && applied_coupons.length > 0) {
        const uniqueCouponIds = new Set<number>();

        for (const appliedCoupon of applied_coupons) {
          uniqueCouponIds.add(appliedCoupon.coupon_id);

          await client.query(
            `INSERT INTO order_coupons (order_id, coupon_id, coupon_type, variant_id)
             VALUES ($1, $2, 'item_level', $3)`,
            [order.order_id, appliedCoupon.coupon_id, appliedCoupon.variant_id]
          );
        }

        for (const couponId of uniqueCouponIds) {
          await client.query(
            'UPDATE coupons SET usage_count_total = usage_count_total + 1 WHERE coupon_id = $1',
            [couponId]
          );
        }
      }

      // Track cart-level coupon
      if (cart_level_coupon_id) {
        await client.query(
          `INSERT INTO order_coupons (order_id, coupon_id, coupon_type, variant_id)
           VALUES ($1, $2, 'cart_level', NULL)`,
          [order.order_id, cart_level_coupon_id]
        );

        await client.query(
          'UPDATE coupons SET usage_count_total = usage_count_total + 1 WHERE coupon_id = $1',
          [cart_level_coupon_id]
        );
      }

      // Clear user's cart
      await client.query(
        'DELETE FROM shopping_cart_items WHERE user_id = $1',
        [user.userId]
      );

      await client.query('COMMIT');

      // Fetch complete order details for confirmation email
      const orderDetailsResult = await pool.query(
        `SELECT 
          o.*,
          u.first_name,
          u.email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = $1`,
        [order.order_id]
      );

      const orderItemsResult = await pool.query(
        `SELECT 
          oi.product_name,
          oi.variant_details,
          oi.quantity,
          oi.price_at_purchase,
          pi.img_url
        FROM order_items oi
        LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
        LEFT JOIN product_images pi ON pv.variant_id = pi.variant_id AND pi.is_primary = true
        WHERE oi.order_id = $1`,
        [order.order_id]
      );

      const orderDetailsData = orderDetailsResult.rows[0];
      const orderItemsData = orderItemsResult.rows;

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail(
          orderDetailsData.customer_email,
          orderDetailsData.first_name,
          {
            order_number: orderNumber,
            total_price: total_price,
            subtotal,
            discount_amount: discount_amount || 0,
            shipping_cost,
            tax_amount: tax_amount || 0,
            first_name: orderDetailsData.first_name,
            last_name: orderDetailsData.last_name,
            address_line1: orderDetailsData.address_line1,
            address_line2: orderDetailsData.address_line2,
            city: orderDetailsData.city,
            state: orderDetailsData.state,
            zip: orderDetailsData.zip,
            country: orderDetailsData.country,
            items: orderItemsData.map((item: any) => ({
              product_name: item.product_name,
              variant_details: item.variant_details,
              quantity: item.quantity,
              price_at_purchase: parseFloat(item.price_at_purchase),
              img_url: item.img_url,
            })),
          }
        );
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }

      res.status(201).json({
        message: "Order created successfully",
        order: {
          order_id: order.order_id,
          order_number: orderNumber,
          total_price: total_price,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET user's order history
 */
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { limit, offset } = req.query;

    const isAdminRoute = req.path === '/admin/orders';
    const showAllOrders = isAdminRoute && (user.role === 'admin' || user.role === 'manager');

    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.order_number,
        o.subtotal,
        o.discount_amount,
        o.shipping_cost,
        o.tax_amount,
        o.total_price,
        o.total_weight_oz,
        o.status,
        o.tracking_number,
        o.shipped_at,
        o.delivered_at,
        o.created_at,
        o.first_name,
        o.last_name,
        o.address_line1,
        o.address_line2,
        o.city,
        o.state,
        o.zip,
        o.country,
        o.customer_email,
        COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE ($1::boolean = true OR o.user_id = $2)
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4`,
      [showAllOrders, user.userId, limit || 20, offset || 0]
    );

    const orders = result.rows.map(order => ({
      ...order,
      subtotal: parseFloat(order.subtotal),
      discount_amount: parseFloat(order.discount_amount),
      shipping_cost: parseFloat(order.shipping_cost),
      tax_amount: parseFloat(order.tax_amount),
      total_price: parseFloat(order.total_price),
      total_weight_oz: order.total_weight_oz ? parseFloat(order.total_weight_oz) : null,
      item_count: parseInt(order.item_count)
    }));

    res.json(orders);

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET specific order details by order ID
 */
export const getOrderDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { orderId } = req.params;

    const orderResult = await pool.query(
      `SELECT 
        o.*,
        -- Auth user snapshot (already on orders row)
        -- Guest fallback: pull from guest_orders if snapshot fields are null
        COALESCE(o.first_name, go.guest_first_name)   AS first_name,
        COALESCE(o.last_name, go.guest_last_name)      AS last_name,
        COALESCE(o.address_line1, go.address_line1)    AS address_line1,
        COALESCE(o.address_line2, go.address_line2)    AS address_line2,
        COALESCE(o.city, go.city)                      AS city,
        COALESCE(o.state, go.state)                    AS state,
        COALESCE(o.zip, go.zip)                        AS zip,
        COALESCE(o.country, go.country)                AS country,
        COALESCE(o.customer_email, go.guest_email)     AS customer_email,
        -- Guest-specific fields
        go.guest_email,
        go.guest_first_name,
        go.guest_last_name,
        go.guest_phone,
        -- Whether this is a guest order
        CASE WHEN go.guest_order_id IS NOT NULL THEN true ELSE false END AS is_guest_order,
        u.first_name   AS user_first_name,
        u.last_name    AS user_last_name,
        sl.location_name,
        sl.city        AS seller_city,
        sl.state       AS seller_state,
        sb.box_name,
        sb.box_type,
        sb.length_in   AS box_length,
        sb.width_in    AS box_width,
        sb.height_in   AS box_height
      FROM orders o
      LEFT JOIN guest_orders go ON go.order_id = o.order_id
      LEFT JOIN users u ON u.user_id = o.user_id
      LEFT JOIN seller_locations sl ON sl.location_id = o.location_id
      LEFT JOIN shipping_boxes sb ON sb.box_id = o.selected_box_id
      WHERE o.order_id = $1 AND ($2::boolean = true OR o.user_id = $3)`,
      [orderId, user.role === 'admin' || user.role === 'manager', user.userId]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT 
        oi.*,
        pi.img_url
      FROM order_items oi
      LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = TRUE
      WHERE oi.order_id = $1
      ORDER BY oi.order_item_id`,
      [orderId]
    );

    const orderDetails = {
      ...order,
      subtotal: parseFloat(order.subtotal),
      discount_amount: parseFloat(order.discount_amount),
      shipping_cost: parseFloat(order.shipping_cost),
      tax_amount: parseFloat(order.tax_amount),
      total_price: parseFloat(order.total_price),
      total_weight_oz: order.total_weight_oz ? parseFloat(order.total_weight_oz) : null,
      items: itemsResult.rows.map((item: any) => ({
        ...item,
        price_at_purchase: parseFloat(item.price_at_purchase)
      }))
    };

    res.json(orderDetails);

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET specific order details by order number
 */
export const getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { orderNumber } = req.params;

    const orderResult = await pool.query(
      `SELECT 
        o.*,
        sl.location_name,
        sl.city as seller_city,
        sl.state as seller_state,
        sb.box_name,
        sb.box_type,
        sb.length_in as box_length,
        sb.width_in as box_width,
        sb.height_in as box_height
      FROM orders o
      LEFT JOIN seller_locations sl ON sl.location_id = o.location_id
      LEFT JOIN shipping_boxes sb ON sb.box_id = o.selected_box_id
      WHERE o.order_number = $1 AND o.user_id = $2`,
      [orderNumber, user.userId]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT 
        oi.*,
        pi.img_url
      FROM order_items oi
      LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
      LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = TRUE
      WHERE oi.order_id = $1
      ORDER BY oi.order_item_id`,
      [order.order_id]
    );

    const orderDetails = {
      ...order,
      subtotal: parseFloat(order.subtotal),
      discount_amount: parseFloat(order.discount_amount),
      shipping_cost: parseFloat(order.shipping_cost),
      tax_amount: parseFloat(order.tax_amount),
      total_price: parseFloat(order.total_price),
      total_weight_oz: order.total_weight_oz ? parseFloat(order.total_weight_oz) : null,
      items: itemsResult.rows.map(item => ({
        ...item,
        price_at_purchase: parseFloat(item.price_at_purchase)
      }))
    };

    res.json(orderDetails);

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR BOGO VALIDATION
// ============================================================================

/**
 * Get all variant IDs that are eligible for a specific coupon
 */
const getEligibleVariantsForCoupon = async (
  client: any,
  coupon: any,
  cartVariantIds: number[]
): Promise<number[]> => {
  const { applies_to_type, applies_to_id, coupon_id } = coupon;

  // If coupon applies to 'all', all cart items are eligible
  if (applies_to_type === 'all') {
    return cartVariantIds;
  }

  let eligibleVariantIds: number[] = [];

  switch (applies_to_type) {
    case 'category': {
      // Get all variants that belong to products in this category
      const result = await client.query(
        `SELECT DISTINCT pv.variant_id
         FROM product_variants pv
         JOIN products p ON p.product_id = pv.product_id
         JOIN product_categories pc ON pc.product_id = p.product_id
         WHERE pc.category_id = $1
         AND pv.variant_id = ANY($2)`,
        [applies_to_id, cartVariantIds]
      );
      eligibleVariantIds = result.rows.map((r: any) => r.variant_id);
      break;
    }

    case 'product_type': {
      // Get all variants that belong to products of this type
      const result = await client.query(
        `SELECT pv.variant_id
         FROM product_variants pv
         JOIN products p ON p.product_id = pv.product_id
         WHERE p.product_type_id = $1
         AND pv.variant_id = ANY($2)`,
        [applies_to_id, cartVariantIds]
      );
      eligibleVariantIds = result.rows.map((r: any) => r.variant_id);
      break;
    }

    case 'product': {
      // Get all variants of this specific product
      const result = await client.query(
        `SELECT variant_id
         FROM product_variants
         WHERE product_id = $1
         AND variant_id = ANY($2)`,
        [applies_to_id, cartVariantIds]
      );
      eligibleVariantIds = result.rows.map((r: any) => r.variant_id);
      break;
    }

    case 'variant': {
      // Only this specific variant is eligible
      if (cartVariantIds.includes(applies_to_id)) {
        eligibleVariantIds = [applies_to_id];
      }
      break;
    }

    case 'custom_group': {
      // Get variants from the coupon_variant_groups table
      const result = await client.query(
        `SELECT variant_id
         FROM coupon_variant_groups
         WHERE coupon_id = $1
         AND variant_id = ANY($2)`,
        [coupon_id, cartVariantIds]
      );
      eligibleVariantIds = result.rows.map((r: any) => r.variant_id);
      break;
    }

    default:
      eligibleVariantIds = [];
  }

  return eligibleVariantIds;
};

/**
 * Calculate BOGO discount across multiple eligible items
 */
const calculateBogoDiscount = (
  eligibleItems: Array<{ variant_id: number; quantity: number; price: number }>,
  buyQty: number,
  getQty: number,
  discountPercentage: number,
  maxDiscountAmount?: number
): Map<number, number> => {
  const discountMap = new Map<number, number>();

  // If no eligible items, return empty map
  if (eligibleItems.length === 0) {
    return discountMap;
  }

  // Calculate total quantity across all eligible items
  const totalQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate how many complete BOGO sets we have
  const completeSets = Math.floor(totalQuantity / (buyQty + getQty));
  
  // Calculate how many items should be discounted
  const itemsToDiscount = completeSets * getQty;

  if (itemsToDiscount === 0) {
    // Not enough items to form a complete set
    return discountMap;
  }

  // Create array of individual items with their prices for sorting
  // Each cart item with quantity > 1 gets expanded into individual entries
  const individualItems: Array<{ variant_id: number; price: number }> = [];
  for (const item of eligibleItems) {
    for (let i = 0; i < item.quantity; i++) {
      individualItems.push({ variant_id: item.variant_id, price: item.price });
    }
  }

  // Sort by price ascending (cheapest items get discounted)
  individualItems.sort((a, b) => a.price - b.price);

  // Apply discount to the cheapest items
  let totalDiscount = 0;
  for (let i = 0; i < itemsToDiscount; i++) {
    const item = individualItems[i];
    const itemDiscount = item.price * (discountPercentage / 100);
    
    // Track discount per variant
    const currentDiscount = discountMap.get(item.variant_id) || 0;
    discountMap.set(item.variant_id, currentDiscount + itemDiscount);
    
    totalDiscount += itemDiscount;
  }

  // Apply max discount cap if set (distribute proportionally if needed)
  if (maxDiscountAmount && totalDiscount > maxDiscountAmount) {
    const ratio = maxDiscountAmount / totalDiscount;
    for (const [variantId, discount] of discountMap.entries()) {
      discountMap.set(variantId, discount * ratio);
    }
  }

  return discountMap;
};

// ============================================================================
// COUPON VALIDATION
// ============================================================================

/**
 * VALIDATE coupons before checkout
 * Handles both item-level and cart-level coupons
 */
export const validateCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { cart_items, cart_level_coupon_id } = req.body;

    if (!cart_items || cart_items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // ========================================================================
      // SHARED HELPER: get how many times this user has used a specific coupon
      // ========================================================================

      const getUserUsageCount = async (couponId: number): Promise<number> => {
        const result = await client.query(
          `SELECT COUNT(DISTINCT oc.order_id) AS user_usage_count
           FROM order_coupons oc
           JOIN orders o ON oc.order_id = o.order_id
           WHERE oc.coupon_id = $1 AND o.user_id = $2`,
          [couponId, user.userId]
        );
        return parseInt(result.rows[0].user_usage_count);
      };

      // ========================================================================
      // STEP 1: VALIDATE ITEM-LEVEL COUPONS
      // ========================================================================

      const validated_discounts: Array<{
        variant_id: number;
        coupon_id: number | null;
        original_price: number;
        discount_amount: number;
        final_price: number;
      }> = [];

      const errors: Array<{
        variant_id: number;
        coupon_id: number;
        error: string;
      }> = [];

      // Fetch all unique item-level coupons in one query
      const itemCouponIds = cart_items
        .map((item: any) => item.selected_coupon_id)
        .filter((id: any) => id != null);

      let itemCoupons: any[] = [];
      if (itemCouponIds.length > 0) {
        const itemCouponsResult = await client.query(
          `SELECT * FROM coupons WHERE coupon_id = ANY($1)`,
          [itemCouponIds]
        );
        itemCoupons = itemCouponsResult.rows;
      }

      // ========================================================================
      // STEP 1A: PRE-CALCULATE BOGO DISCOUNTS
      // ========================================================================

      const bogoDiscountMaps = new Map<number, Map<number, number>>();
      const cartVariantIds = cart_items.map((item: any) => item.variant_id);

      for (const coupon of itemCoupons) {
        if (coupon.discount_type === "bogo") {
          const itemsWithThisCoupon = cart_items.filter(
            (item: any) => item.selected_coupon_id === coupon.coupon_id
          );

          if (itemsWithThisCoupon.length === 0) continue;

          const eligibleVariantIds = await getEligibleVariantsForCoupon(
            client,
            coupon,
            cartVariantIds
          );

          const eligibleItems = itemsWithThisCoupon
            .filter((item: any) => eligibleVariantIds.includes(item.variant_id))
            .map((item: any) => ({
              variant_id: item.variant_id,
              quantity: item.quantity,
              price: item.price,
            }));

          const discountMap = calculateBogoDiscount(
            eligibleItems,
            coupon.bogo_buy_quantity || 1,
            coupon.bogo_get_quantity || 1,
            parseFloat(coupon.bogo_discount_percentage) || 100,
            coupon.max_discount_amount
              ? parseFloat(coupon.max_discount_amount)
              : undefined
          );

          bogoDiscountMaps.set(coupon.coupon_id, discountMap);
        }
      }

      // ========================================================================
      // STEP 1B: PROCESS EACH CART ITEM
      // ========================================================================

      for (const item of cart_items) {
        const { variant_id, quantity, price, selected_coupon_id } = item;
        let discount_amount = 0;

        if (selected_coupon_id) {
          const coupon = itemCoupons.find(
            (c) => c.coupon_id === selected_coupon_id
          );

          // Check 1: coupon exists
          if (!coupon) {
            errors.push({ variant_id, coupon_id: selected_coupon_id, error: "Coupon not found" });
            validated_discounts.push({
              variant_id, coupon_id: null,
              original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
            });
            continue;
          }

          // Check 3: still active
          if (!coupon.is_active) {
            errors.push({ variant_id, coupon_id: selected_coupon_id, error: "Coupon is no longer active" });
            validated_discounts.push({
              variant_id, coupon_id: null,
              original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
            });
            continue;
          }

          // Check 2: not expired
          if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            errors.push({ variant_id, coupon_id: selected_coupon_id, error: "Coupon has expired" });
            validated_discounts.push({
              variant_id, coupon_id: null,
              original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
            });
            continue;
          }

          // Email verification check
          if (coupon.requires_verified_email) {
            const userResult = await client.query(
              "SELECT is_email_verified FROM users WHERE user_id = $1",
              [user.userId]
            );
            if (!userResult.rows[0]?.is_email_verified) {
              errors.push({ variant_id, coupon_id: selected_coupon_id, error: "Email verification required" });
              validated_discounts.push({
                variant_id, coupon_id: null,
                original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
              });
              continue;
            }
          }

          // Check 4: total usage limit not exceeded
          if (
            coupon.usage_limit_total &&
            coupon.usage_count_total >= coupon.usage_limit_total
          ) {
            errors.push({ variant_id, coupon_id: selected_coupon_id, error: "Coupon usage limit reached" });
            validated_discounts.push({
              variant_id, coupon_id: null,
              original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
            });
            continue;
          }

          // Check 5: per-user limit not exceeded
          if (coupon.usage_limit_per_user) {
            const timesUsed = await getUserUsageCount(coupon.coupon_id);
            if (timesUsed >= coupon.usage_limit_per_user) {
              errors.push({
                variant_id,
                coupon_id: selected_coupon_id,
                error: "You've already used this coupon the maximum number of times",
              });
              validated_discounts.push({
                variant_id, coupon_id: null,
                original_price: price * quantity, discount_amount: 0, final_price: price * quantity,
              });
              continue;
            }
          }

          // All checks passed — calculate discount
          if (coupon.discount_type === "percentage") {
            discount_amount = price * quantity * (parseFloat(coupon.discount_value) / 100);
            if (coupon.max_discount_amount) {
              discount_amount = Math.min(discount_amount, parseFloat(coupon.max_discount_amount));
            }
          } else if (coupon.discount_type === "fixed") {
            discount_amount = Math.min(parseFloat(coupon.discount_value), price * quantity);
            if (coupon.max_discount_amount) {
              discount_amount = Math.min(discount_amount, parseFloat(coupon.max_discount_amount));
            }
          } else if (coupon.discount_type === "bogo") {
            const discountMap = bogoDiscountMaps.get(selected_coupon_id);
            discount_amount = discountMap?.get(variant_id) || 0;
          }
        }

        validated_discounts.push({
          variant_id,
          coupon_id: selected_coupon_id || null,
          original_price: price * quantity,
          discount_amount,
          final_price: price * quantity - discount_amount,
        });
      }

      // ========================================================================
      // STEP 2: VALIDATE CART-LEVEL COUPON
      // ========================================================================

      let cart_level_discount: {
        coupon_id: number;
        discount_amount: number;
        free_shipping?: boolean;
        error?: string;
      } | null = null;

      if (cart_level_coupon_id) {
        const cartCouponResult = await client.query(
          `SELECT * FROM coupons WHERE coupon_id = $1`,
          [cart_level_coupon_id]
        );

        // Check 1: coupon exists
        if (cartCouponResult.rows.length === 0) {
          cart_level_discount = {
            coupon_id: cart_level_coupon_id,
            discount_amount: 0,
            free_shipping: false,
            error: "Coupon not found",
          };
        } else {
          const cartCoupon = cartCouponResult.rows[0];

          // Check 3: still active
          if (!cartCoupon.is_active) {
            cart_level_discount = {
              coupon_id: cart_level_coupon_id,
              discount_amount: 0,
              free_shipping: false,
              error: "Coupon is no longer active",
            };
          }
          // Verify it's actually a cart-level coupon
          else if (cartCoupon.applies_to_type !== "all") {
            cart_level_discount = {
              coupon_id: cart_level_coupon_id,
              discount_amount: 0,
              free_shipping: false,
              error: "This coupon is not a cart-level coupon",
            };
          }
          // Check 2: not expired
          else if (
            cartCoupon.valid_until &&
            new Date(cartCoupon.valid_until) < new Date()
          ) {
            cart_level_discount = {
              coupon_id: cart_level_coupon_id,
              discount_amount: 0,
              free_shipping: false,
              error: "Coupon has expired",
            };
          }
          // Check 4: total usage limit not exceeded
          else if (
            cartCoupon.usage_limit_total &&
            cartCoupon.usage_count_total >= cartCoupon.usage_limit_total
          ) {
            cart_level_discount = {
              coupon_id: cart_level_coupon_id,
              discount_amount: 0,
              free_shipping: false,
              error: "Coupon usage limit reached",
            };
          }
          // Check 5: per-user limit not exceeded
          else if (cartCoupon.usage_limit_per_user) {
            const timesUsed = await getUserUsageCount(cartCoupon.coupon_id);
            if (timesUsed >= cartCoupon.usage_limit_per_user) {
              cart_level_discount = {
                coupon_id: cart_level_coupon_id,
                discount_amount: 0,
                free_shipping: false,
                error: "You've already used this coupon the maximum number of times",
              };
            }
          }

          // All checks passed — calculate cart-level discount
          if (!cart_level_discount) {
            // Email verification check
            if (cartCoupon.requires_verified_email) {
              const userResult = await client.query(
                "SELECT is_email_verified FROM users WHERE user_id = $1",
                [user.userId]
              );
              if (!userResult.rows[0]?.is_email_verified) {
                cart_level_discount = {
                  coupon_id: cart_level_coupon_id,
                  discount_amount: 0,
                  free_shipping: false,
                  error: "Email verification required",
                };
              }
            }

            if (!cart_level_discount) {
              // Calculate subtotal after item-level discounts
              const cartSubtotalAfterItemDiscounts = validated_discounts.reduce(
                (sum, item) => sum + item.final_price,
                0
              );

              // Minimum purchase amount check
              if (
                cartCoupon.min_purchase_amount &&
                cartSubtotalAfterItemDiscounts <
                  parseFloat(cartCoupon.min_purchase_amount)
              ) {
                cart_level_discount = {
                  coupon_id: cart_level_coupon_id,
                  discount_amount: 0,
                  free_shipping: false,
                  error: `Minimum purchase of $${parseFloat(cartCoupon.min_purchase_amount).toFixed(2)} required (current: $${cartSubtotalAfterItemDiscounts.toFixed(2)})`,
                };
              } else {
                // Calculate discount amount by type
                let cartDiscountAmount = 0;
                let isFreeShipping = false;

                if (cartCoupon.discount_type === "percentage") {
                  cartDiscountAmount =
                    cartSubtotalAfterItemDiscounts *
                    (parseFloat(cartCoupon.discount_value) / 100);
                } else if (cartCoupon.discount_type === "fixed") {
                  cartDiscountAmount = parseFloat(cartCoupon.discount_value);
                } else if (cartCoupon.discount_type === "free_shipping_only") {
                  cartDiscountAmount = 0;
                  isFreeShipping = true;
                }

                // Apply max discount cap (not for free_shipping_only)
                if (
                  cartCoupon.max_discount_amount &&
                  cartCoupon.discount_type !== "free_shipping_only"
                ) {
                  cartDiscountAmount = Math.min(
                    cartDiscountAmount,
                    parseFloat(cartCoupon.max_discount_amount)
                  );
                }

                // Never discount more than the subtotal
                if (cartCoupon.discount_type !== "free_shipping_only") {
                  cartDiscountAmount = Math.min(
                    cartDiscountAmount,
                    cartSubtotalAfterItemDiscounts
                  );
                }

                cart_level_discount = {
                  coupon_id: cart_level_coupon_id,
                  discount_amount: cartDiscountAmount,
                  free_shipping: isFreeShipping,
                };
              }
            }
          }
        }
      }

      await client.query("COMMIT");

      // ========================================================================
      // STEP 3: RETURN VALIDATION RESULTS
      // ========================================================================

      const item_level_discount = validated_discounts.reduce(
        (sum, item) => sum + item.discount_amount,
        0
      );

      const total_discount =
        item_level_discount + (cart_level_discount?.discount_amount || 0);

      res.json({
        valid:
          errors.length === 0 &&
          (!cart_level_discount || !cart_level_discount.error),
        errors,
        validated_discounts,
        item_level_discount,
        cart_level_discount,
        total_discount,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error validating coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// ORDER STATUS MANAGEMENT
// ============================================================================

/**
 * UPDATE order status and log the change
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      res.status(403).json({ message: "Unauthorized - Admin access required" });
      return;
    }

    const { orderId } = req.params;
    const { status, notes, tracking_number, shipping_carrier, shipping_service } = req.body;

    const validStatuses = ['pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
      return
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderCheck = await client.query(
        'SELECT * FROM orders WHERE order_id = $1',
        [orderId]
      );

      if (orderCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ message: "Order not found" });
      return;
      }

      const currentOrder = orderCheck.rows[0];

      const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
      const updateValues: any[] = [status];
      let paramCounter = 2;

      if (tracking_number) {
        updateFields.push(`tracking_number = $${paramCounter}`);
        updateValues.push(tracking_number);
        paramCounter++;
      }

      if (shipping_carrier) {
        updateFields.push(`shipping_carrier = $${paramCounter}`);
        updateValues.push(shipping_carrier);
        paramCounter++;
      }

      if (shipping_service) {
        updateFields.push(`shipping_service = $${paramCounter}`);
        updateValues.push(shipping_service);
        paramCounter++;
      }

      if (status === 'shipped' && currentOrder.status !== 'shipped') {
        updateFields.push('shipped_at = NOW()');
      }

      if (status === 'delivered' && currentOrder.status !== 'delivered') {
        updateFields.push('delivered_at = NOW()');
      }

      updateValues.push(orderId);

      const updateQuery = `
        UPDATE orders 
        SET ${updateFields.join(', ')}
        WHERE order_id = $${paramCounter}
        RETURNING *
      `;

      const orderResult = await client.query(updateQuery, updateValues);
      const updatedOrder = orderResult.rows[0];

      let logNotes = notes || `Status updated to ${status}`;
      if (tracking_number && status === 'shipped') {
        logNotes += ` | Tracking: ${tracking_number}`;
        if (shipping_carrier) {
          logNotes += ` (${shipping_carrier})`;
        }
      }

      await client.query(
        `INSERT INTO order_status_logs (order_id, status, notes)
         VALUES ($1, $2, $3)`,
        [orderId, status, logNotes]
      );

      await client.query('COMMIT');

      // Send shipping notification — check both registered users and guests
      if (status === 'shipped' && currentOrder.status !== 'shipped') {
        try {
          // Try registered user first
          const customerResult = await pool.query(
            `SELECT u.email, u.first_name
             FROM orders o
             JOIN users u ON u.user_id = o.user_id
             WHERE o.order_id = $1`,
            [orderId]
          );

          let recipientEmail: string | null = null;
          let recipientName: string | null = null;

          if (customerResult.rows.length > 0) {
            recipientEmail = customerResult.rows[0].email;
            recipientName = customerResult.rows[0].first_name;
          } else {
            // Fall back to guest_orders
            const guestResult = await pool.query(
              `SELECT guest_email, guest_first_name FROM guest_orders WHERE order_id = $1`,
              [orderId]
            );
            if (guestResult.rows.length > 0) {
              recipientEmail = guestResult.rows[0].guest_email;
              recipientName = guestResult.rows[0].guest_first_name;
            }
          }

          if (recipientEmail && recipientName) {
            await sendShippingNotificationEmail(
              recipientEmail,
              recipientName,
              {
                order_number: updatedOrder.order_number,
                total_price: parseFloat(updatedOrder.total_price),
                tracking_number: tracking_number || updatedOrder.tracking_number || '',
              },
              // isGuest: true when the email came from guest_orders rather than users
              customerResult.rows.length === 0
            );
          }
        } catch (emailError) {
          console.error("Failed to send shipping notification email:", emailError);
        }
      }
      
      res.json({
        message: "Order status updated successfully",
        order: {
          order_id: updatedOrder.order_id,
          order_number: updatedOrder.order_number,
          status: updatedOrder.status,
          tracking_number: updatedOrder.tracking_number,
          shipped_at: updatedOrder.shipped_at,
          delivered_at: updatedOrder.delivered_at,
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET order status history
 */
export const getOrderStatusHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { orderId } = req.params;

    // Verify order belongs to user (or user is admin)
    const orderCheck = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1 AND (user_id = $2 OR $3 = true)',
      [orderId, user.userId, user.role === 'admin' || user.role === 'manager']
    );

    if (orderCheck.rows.length === 0) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Get status history
    const historyResult = await pool.query(
      `SELECT 
        log_id,
        status,
        notes,
        created_at
      FROM order_status_logs
      WHERE order_id = $1
      ORDER BY created_at ASC`,
      [orderId]
    );

    res.json({
      order_id: parseInt(orderId),
      order_number: orderCheck.rows[0].order_number,
      current_status: orderCheck.rows[0].status,
      status_history: historyResult.rows
    });

  } catch (error) {
    console.error("Error fetching order status history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// GUEST HANDLER FUNCTIONS
// ============================================================================

/**
 * CREATE a guest order (no auth required)
 */
export const createGuestOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      guest_info,
      shipping_address,
      cart_items,
      subtotal,
      shipping_cost,
      tax_amount,
      total_price,
      selected_shipping_rate_id,
      shipping_carrier,
      shipping_service,
    } = req.body;

    // Validate required fields 
    if (!guest_info?.email || !guest_info?.first_name) {
      res.status(400).json({ message: "Guest email and first name are required" });
      return;
    }

    if (
      !shipping_address?.address_line1 ||
      !shipping_address?.city ||
      !shipping_address?.state ||
      !shipping_address?.zip
    ) {
      res.status(400).json({ message: "Complete shipping address is required" });
      return;
    }

    if (!cart_items || cart_items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get location_id from the first cart item 
      const firstVariantResult = await client.query(
        'SELECT location_id FROM product_variants WHERE variant_id = $1',
        [cart_items[0].variant_id]
      );

      if (firstVariantResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Invalid product" });
        return;
      }

      const location_id = firstVariantResult.rows[0].location_id;

      // Fetch variant dimensions for box packing + weight calculation 
      const variantIds = cart_items.map((item: any) => item.variant_id);
      const variantsResult = await client.query(
        `SELECT variant_id, length_in, width_in, height_in, weight_oz
         FROM product_variants WHERE variant_id = ANY($1)`,
        [variantIds]
      );

      const packingItems = cart_items.map((cartItem: any) => {
        const variant = variantsResult.rows.find((v: any) => v.variant_id === cartItem.variant_id);
        return {
          variant_id: cartItem.variant_id,
          quantity: cartItem.quantity,
          length_in: variant?.length_in ? parseFloat(variant.length_in) : 0,
          width_in: variant?.width_in ? parseFloat(variant.width_in) : 0,
          height_in: variant?.height_in ? parseFloat(variant.height_in) : 0,
        };
      });

      let totalWeightOz = 0;
      for (const cartItem of cart_items) {
        const variant = variantsResult.rows.find((v: any) => v.variant_id === cartItem.variant_id);
        const weightOz = variant?.weight_oz ? parseFloat(variant.weight_oz) : 8;
        totalWeightOz += weightOz * cartItem.quantity;
      }

      // Box selection 
      let selectedBoxId: number | null = null;
      try {
        const selectedBox = await selectShippingBox(packingItems, location_id);
        if (selectedBox) {
          selectedBoxId = selectedBox.box_id;
        }
      } catch (boxError) {
        console.error("❌ Guest box selection failed:", boxError);
      }

      // Generate unique order number 
      const orderNumber = `GST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Insert into orders (user_id and shipping_address_id are NULL) 
      const orderResult = await client.query(
        `INSERT INTO orders
          (user_id, shipping_address_id, location_id, order_number,
           subtotal, discount_amount, item_level_discount, cart_level_discount,
           shipping_cost, tax_amount, total_price,
           shipping_carrier, shipping_service,
           selected_box_id, total_weight_oz, status, created_at)
         VALUES
          (NULL, NULL, $1, $2,
           $3, 0, 0, 0,
           $4, $5, $6,
           $7, $8,
           $9, $10, 'pending', NOW())
         RETURNING *`,
        [
          location_id, orderNumber,
          subtotal, shipping_cost, tax_amount || 0, total_price,
          shipping_carrier || null, shipping_service || null,
          selectedBoxId, totalWeightOz,
        ]
      );

      const order = orderResult.rows[0];

      // Insert into guest_orders
      await client.query(
        `INSERT INTO guest_orders
          (order_id, guest_email, guest_first_name, guest_last_name, guest_phone,
           address_name, address_line1, address_line2, city, state, zip, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          order.order_id,
          guest_info.email.toLowerCase().trim(),
          guest_info.first_name.trim(),
          guest_info.last_name?.trim() || null,
          guest_info.phone?.trim() || null,
          shipping_address.address_name?.trim() || null,
          shipping_address.address_line1.trim(),
          shipping_address.address_line2?.trim() || null,
          shipping_address.city.trim(),
          shipping_address.state.trim(),
          shipping_address.zip.trim(),
          shipping_address.country?.trim() || 'USA',
        ]
      );

      // Log initial status
      await logOrderStatus(client, order.order_id, 'pending', 'Guest order placed');

      // Insert order items + decrement stock 
      for (const item of cart_items) {
        const productResult = await client.query(
          `SELECT p.name, pv.color, pv.size, pv.price
           FROM product_variants pv
           JOIN products p ON p.product_id = pv.product_id
           WHERE pv.variant_id = $1`,
          [item.variant_id]
        );

        if (productResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ message: `Invalid product variant: ${item.variant_id}` });
          return;
        }

        const product = productResult.rows[0];
        const variantDetails = [product.color, product.size].filter(Boolean).join(', ');

        await client.query(
          `INSERT INTO order_items
            (order_id, variant_id, product_name, variant_details, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.order_id, item.variant_id, product.name, variantDetails, item.quantity, item.price]
        );

        await client.query(
          'UPDATE product_variants SET quantity = quantity - $1 WHERE variant_id = $2',
          [item.quantity, item.variant_id]
        );
      }

      await client.query('COMMIT');

      // Send order confirmation email
      try {
        const orderItemsResult = await pool.query(
          `SELECT oi.product_name, oi.variant_details, oi.quantity, oi.price_at_purchase, pi.img_url
           FROM order_items oi
           LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
           LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = true
           WHERE oi.order_id = $1`,
          [order.order_id]
        );
      await sendOrderConfirmationEmail(
        guest_info.email,
        guest_info.first_name,
        {
          order_number: orderNumber,
          total_price,
          subtotal,
          discount_amount: 0,
          shipping_cost,
          tax_amount: tax_amount || 0,
          first_name: guest_info.first_name,
          last_name: guest_info.last_name || '',
          address_line1: shipping_address.address_line1,
          address_line2: shipping_address.address_line2 || '',
          city: shipping_address.city,
          state: shipping_address.state,
          zip: shipping_address.zip,
          country: shipping_address.country || 'USA',
          items: orderItemsResult.rows.map((item: any) => ({
            product_name: item.product_name,
            variant_details: item.variant_details,
            quantity: item.quantity,
            price_at_purchase: parseFloat(item.price_at_purchase),
            img_url: item.img_url,
          })),
        },
        true
      );
      } catch (emailError) {
        console.error("Failed to send guest order confirmation email:", emailError);
      }

      res.status(201).json({
        message: "Order created successfully",
        order: {
          order_id: order.order_id,
          order_number: orderNumber,
          total_price,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error creating guest order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * VALIDATE address for GUESTS (no auth required)
 */
export const validateAddressGuest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      address_name,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country
    } = req.body;

    if (country && country !== "US" && country !== "USA") {
      res.status(400).json({
        message: "Address validation is only available for U.S. addresses"
      });
      return;
    }

    const validationResult = await validateAddress({
      name: address_name || "Guest",
      street1: address_line1,
      street2: address_line2,
      city,
      state,
      zip,
      country: "US"
    });

    res.json(validationResult);
  } catch (error: any) {
    console.error("Error validating guest address:", error);
    res.status(500).json({ message: error.message || "Failed to validate address" });
  }
};

/**
 * CALCULATE shipping rates for GUESTS (no auth, address passed inline)
 */
export const calculateShippingGuest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartItems, address } = req.body;

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    if (!address || !address.address_line1 || !address.city || !address.state || !address.zip) {
      res.status(400).json({ message: "Full shipping address is required" });
      return;
    }

    const variantIds = cartItems.map((item: any) => item.variant_id);
    const variantsResult = await pool.query(
      `SELECT variant_id, weight_oz, length_in, width_in, height_in
       FROM product_variants WHERE variant_id = ANY($1)`,
      [variantIds]
    );

    const items: Array<{ weight_oz: number; length_in?: number; width_in?: number; height_in?: number }> = [];
    const packingItems: Array<{ variant_id: number; quantity: number; length_in: number; width_in: number; height_in: number }> = [];

    for (const cartItem of cartItems) {
      const variant = variantsResult.rows.find((v: any) => v.variant_id === cartItem.variant_id);
      if (!variant) {
        res.status(400).json({ message: `Variant ${cartItem.variant_id} not found` });
        return;
      }

      const weightOz = variant.weight_oz || 8;
      for (let i = 0; i < cartItem.quantity; i++) {
        items.push({
          weight_oz: parseFloat(weightOz),
          length_in: variant.length_in ? parseFloat(variant.length_in) : undefined,
          width_in: variant.width_in ? parseFloat(variant.width_in) : undefined,
          height_in: variant.height_in ? parseFloat(variant.height_in) : undefined,
        });
      }

      packingItems.push({
        variant_id: cartItem.variant_id,
        quantity: cartItem.quantity,
        length_in: variant.length_in ? parseFloat(variant.length_in) : 0,
        width_in: variant.width_in ? parseFloat(variant.width_in) : 0,
        height_in: variant.height_in ? parseFloat(variant.height_in) : 0,
      });
    }

    const firstVariantLocation = await pool.query(
      'SELECT location_id FROM product_variants WHERE variant_id = $1',
      [cartItems[0].variant_id]
    );

    if (firstVariantLocation.rows.length === 0) {
      res.status(400).json({ message: "Product location not found" });
      return;
    }

    const locationId = firstVariantLocation.rows[0].location_id;

    let selectedBox: BoxDimensions | undefined;
    let selectedBoxId: number | undefined;
    try {
      const box = await selectShippingBox(packingItems, locationId);
      if (box) {
        selectedBox = {
          length_in: parseFloat(box.length_in.toString()),
          width_in: parseFloat(box.width_in.toString()),
          height_in: parseFloat(box.height_in.toString()),
          box_name: box.box_name,
        };
        selectedBoxId = box.box_id;
      }
    } catch (boxError) {
      console.error("⚠️  Guest box selection failed, continuing:", boxError);
    }

    const shippingRates = await getRealTimeShippingRates(
      items,
      {
        name: `${address.first_name || "Guest"} ${address.last_name || ""}`.trim(),
        street1: address.address_line1,
        street2: address.address_line2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || "US",
      },
      selectedBox
    );

    const totalWeightOz = items.reduce((sum, item) => sum + item.weight_oz, 0);

    res.json({
      shipping_options: shippingRates,
      weight_lbs: parseFloat((totalWeightOz / 16).toFixed(2)),
      total_items: items.length,
      selected_box: selectedBox ? {
        box_id: selectedBoxId,
        box_name: selectedBox.box_name,
        dimensions: `${selectedBox.length_in}×${selectedBox.width_in}×${selectedBox.height_in}`,
      } : null,
    });
  } catch (error: any) {
    console.error("Error calculating guest shipping:", error);
    res.status(500).json({ message: "Failed to calculate shipping", error: error.message });
  }
};

/**
 * VALIDATE cart items for GUESTS (no auth required)
 */
export const validateCartGuest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const variantIds = cartItems.map((item: any) => item.variant_id);

    const result = await pool.query(
      `SELECT 
        pv.variant_id,
        pv.price,
        pv.quantity as stock,
        pv.is_active,
        p.name
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      WHERE pv.variant_id = ANY($1)`,
      [variantIds]
    );

    interface ValidationResult {
      variant_id: number;
      valid: boolean;
      error?: string;
      available_stock?: number;
      price_changed?: boolean;
      current_price?: number;
      cart_price?: number;
    }

    const validationResults: ValidationResult[] = cartItems.map((cartItem: any) => {
      const dbItem = result.rows.find((row: any) => row.variant_id === cartItem.variant_id);

      if (!dbItem) {
        return { variant_id: cartItem.variant_id, valid: false, error: "Product no longer available" };
      }
      if (!dbItem.is_active) {
        return { variant_id: cartItem.variant_id, valid: false, error: "Product is no longer active" };
      }
      if (dbItem.stock < cartItem.quantity) {
        return {
          variant_id: cartItem.variant_id,
          valid: false,
          error: `Insufficient stock. Only ${dbItem.stock} available`,
          available_stock: dbItem.stock
        };
      }

      const priceChanged = Math.abs(parseFloat(dbItem.price) - cartItem.price) > 0.01;
      return {
        variant_id: cartItem.variant_id,
        valid: true,
        price_changed: priceChanged,
        current_price: parseFloat(dbItem.price),
        cart_price: cartItem.price
      };
    });

    res.json({
      valid: validationResults.every(item => item.valid),
      has_price_changes: validationResults.some(item => item.price_changed),
      items: validationResults
    });
  } catch (error) {
    console.error("Error validating guest cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET guest order by order number + email (no auth required)
 */
export const getGuestOrderByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    if (!orderNumber || !email) {
      res.status(400).json({ message: "Order number and email are required" });
      return;
    }

    // Look up in guest_orders, verifying ownership via email
    const orderResult = await pool.query(
      `SELECT
        o.*,
        go.guest_email,
        go.guest_first_name,
        go.guest_last_name,
        go.guest_phone,
        go.address_name,
        go.address_line1,
        go.address_line2,
        go.city,
        go.state,
        go.zip,
        go.country,
        sl.location_name,
        sl.city  AS seller_city,
        sl.state AS seller_state,
        sb.box_name,
        sb.box_type,
        sb.length_in AS box_length,
        sb.width_in  AS box_width,
        sb.height_in AS box_height
       FROM orders o
       JOIN guest_orders go ON go.order_id = o.order_id
       LEFT JOIN seller_locations sl ON sl.location_id = o.location_id
       LEFT JOIN shipping_boxes sb ON sb.box_id = o.selected_box_id
       WHERE o.order_number = $1
         AND go.guest_email = $2`,
      [orderNumber, (email as string).toLowerCase().trim()]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ message: "Order not found. Please check your order number and email." });
      return;
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, pi.img_url
       FROM order_items oi
       LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
       LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = TRUE
       WHERE oi.order_id = $1
       ORDER BY oi.order_item_id`,
      [order.order_id]
    );

    res.json({
      ...order,
      subtotal: parseFloat(order.subtotal),
      discount_amount: parseFloat(order.discount_amount),
      shipping_cost: parseFloat(order.shipping_cost),
      tax_amount: parseFloat(order.tax_amount),
      total_price: parseFloat(order.total_price),
      items: itemsResult.rows.map((item: any) => ({
        ...item,
        price_at_purchase: parseFloat(item.price_at_purchase),
      })),
    });

  } catch (error) {
    console.error("Error fetching guest order:", error);
    res.status(500).json({ message: "Server error" });
  }
};
