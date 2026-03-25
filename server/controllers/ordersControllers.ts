import { Request, Response } from "express";
import { getUserFromToken } from "../middleware/authMiddleware";
import { pool } from "../db";
import { sendShippingNotificationEmail } from "../utils/emailService";

// ============================================================================
// ORDER LOOKUP
// ============================================================================

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
        o.shipping_carrier,
        o.shipping_service,
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

// ============================================================================
// ORDER SPECIFICS
// ============================================================================

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