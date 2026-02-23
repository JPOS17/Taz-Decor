import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// COUPONS - GET ALL
// ============================================================================

/**
 * GET all coupons for management with optional filters
 */
export const getAllCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, appliesTo, search, locationId } = req.query;
    
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];
    let paramCounter = 1;

    // Status filter
    if (status === 'active') {
      whereConditions.push('c.is_active = TRUE');
      whereConditions.push('(c.valid_until IS NULL OR c.valid_until > NOW())');
    } else if (status === 'inactive') {
      whereConditions.push('c.is_active = FALSE');
    } else if (status === 'expired') {
      whereConditions.push('c.valid_until IS NOT NULL AND c.valid_until <= NOW()');
    }

    // Applies to filter
    if (appliesTo && appliesTo !== 'all') {
      // Map 'all_products' filter to 'all' database value
      const appliesToValue = appliesTo === 'all_products' ? 'all' : appliesTo;
      queryParams.push(appliesToValue);
      whereConditions.push(`c.applies_to_type = $${paramCounter}`);
      paramCounter++;
    }

    // Location filter
    if (locationId && locationId !== 'all') {
      queryParams.push(parseInt(locationId as string));
      whereConditions.push(`$${paramCounter} = ANY(c.location_ids)`);
      paramCounter++;
    }

    // Search filter
    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(c.coupon_code ILIKE $${paramCounter} OR c.description ILIKE $${paramCounter})`);
      paramCounter++;
    }

    const result = await pool.query(`
      SELECT 
        c.coupon_id,
        c.coupon_code,
        c.description,
        c.discount_type,
        c.discount_value,
        c.min_purchase_amount,
        c.max_discount_amount,
        c.free_shipping,
        c.applies_to_type,
        c.applies_to_id,
        c.usage_limit_total,
        c.usage_count_total,
        c.usage_limit_per_user,
        c.requires_verified_email,
        c.valid_from,
        c.valid_until,
        c.is_active,
        c.created_at,
        c.bogo_buy_quantity,
        c.bogo_get_quantity,
        c.bogo_discount_percentage,
        c.location_ids,
        CASE 
          WHEN c.applies_to_type = 'category' THEN cat.category_name
          WHEN c.applies_to_type = 'product' THEN p.name
          WHEN c.applies_to_type = 'product_type' THEN pt.type_name
          WHEN c.applies_to_type = 'variant' THEN p_var.name || 
            CASE 
              WHEN pv.color IS NOT NULL AND pv.size IS NOT NULL THEN ' - ' || pv.color || ' / ' || pv.size
              WHEN pv.color IS NOT NULL THEN ' - ' || pv.color
              WHEN pv.size IS NOT NULL THEN ' - ' || pv.size
              ELSE ''
            END
            WHEN c.applies_to_type = 'custom_group' THEN (
            SELECT COUNT(*)::text || ' variants'
            FROM coupon_variant_groups cvg
            WHERE cvg.coupon_id = c.coupon_id
          )
          ELSE 'All Products'
        END as applies_to_name
      FROM coupons c
      LEFT JOIN categories cat ON c.applies_to_type = 'category' AND c.applies_to_id = cat.category_id
      LEFT JOIN products p ON c.applies_to_type = 'product' AND c.applies_to_id = p.product_id
      LEFT JOIN product_types pt ON c.applies_to_type = 'product_type' AND c.applies_to_id = pt.product_type_id
      LEFT JOIN product_variants pv ON c.applies_to_type = 'variant' AND c.applies_to_id = pv.variant_id
      LEFT JOIN products p_var ON pv.product_id = p_var.product_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.created_at DESC
    `, queryParams);

    const coupons = result.rows.map(row => ({
      ...row,
      discount_value: row.discount_value ? parseFloat(row.discount_value) : null,
      min_purchase_amount: row.min_purchase_amount ? parseFloat(row.min_purchase_amount) : null,
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      bogo_buy_quantity: row.bogo_buy_quantity || null,
      bogo_get_quantity: row.bogo_get_quantity || null,
      bogo_discount_percentage: row.bogo_discount_percentage ? parseFloat(row.bogo_discount_percentage) : null
    }));

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// COUPONS - GET BY ID
// ============================================================================

/**
 * GET single coupon by ID
 */
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        CASE 
          WHEN c.applies_to_type = 'category' THEN cat.category_name
          WHEN c.applies_to_type = 'product' THEN p.name
          WHEN c.applies_to_type = 'product_type' THEN pt.type_name
          WHEN c.applies_to_type = 'variant' THEN p.name || ' - ' || COALESCE(pv.color, '') || ' ' || COALESCE(pv.size, '')
          WHEN c.applies_to_type = 'custom_group' THEN (
            SELECT COUNT(*)::text || ' variants'
            FROM coupon_variant_groups cvg
            WHERE cvg.coupon_id = c.coupon_id
          )
          ELSE 'All Products'
        END as applies_to_name
      FROM coupons c
      LEFT JOIN categories cat ON c.applies_to_type = 'category' AND c.applies_to_id = cat.category_id
      LEFT JOIN products p ON (c.applies_to_type = 'product' OR c.applies_to_type = 'variant') 
        AND (c.applies_to_id = p.product_id OR c.applies_to_id IN (SELECT product_id FROM product_variants WHERE variant_id = c.applies_to_id))
      LEFT JOIN product_types pt ON c.applies_to_type = 'product_type' AND c.applies_to_id = pt.product_type_id
      LEFT JOIN product_variants pv ON c.applies_to_type = 'variant' AND c.applies_to_id = pv.variant_id
      WHERE c.coupon_id = $1
    `, [couponId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }

    const coupon = {
      ...result.rows[0],
      discount_value: result.rows[0].discount_value ? parseFloat(result.rows[0].discount_value) : null,
      min_purchase_amount: result.rows[0].min_purchase_amount ? parseFloat(result.rows[0].min_purchase_amount) : null,
      max_discount_amount: result.rows[0].max_discount_amount ? parseFloat(result.rows[0].max_discount_amount) : null,
      bogo_buy_quantity: result.rows[0].bogo_buy_quantity || null,
      bogo_get_quantity: result.rows[0].bogo_get_quantity || null,
      bogo_discount_percentage: result.rows[0].bogo_discount_percentage ? parseFloat(result.rows[0].bogo_discount_percentage) : null
    };

    // If custom_group, fetch the variant IDs WITH product_id info
    if (coupon.applies_to_type === 'custom_group') {
      const groupResult = await pool.query(
        `SELECT 
          cvg.variant_id,
          pv.product_id
        FROM coupon_variant_groups cvg
        JOIN product_variants pv ON cvg.variant_id = pv.variant_id
        WHERE cvg.coupon_id = $1
        ORDER BY cvg.variant_id`,
        [couponId]
      );
      
      // Return both the variant IDs and the grouped data
      coupon.applies_to_id = groupResult.rows.map(row => row.variant_id);
      coupon.variant_details = groupResult.rows; // Include product_id for each variant
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// COUPONS - CREATE
// ============================================================================

/**
 * CREATE new coupon
 */
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      coupon_code,
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      free_shipping,
      applies_to_type,
      applies_to_id,
      usage_limit_total,
      usage_limit_per_user,
      requires_verified_email,
      valid_from,
      valid_until,
      is_active,
      bogo_buy_quantity,
      bogo_get_quantity,
      bogo_discount_percentage,
      location_ids
    } = req.body;

    // Validation for location_ids
    if (!location_ids || !Array.isArray(location_ids) || location_ids.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "At least one store location must be selected" });
      return;
    }

    // Validation for BOGO fields
    if (discount_type === 'bogo') {
      if (!bogo_buy_quantity || bogo_buy_quantity < 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO buy quantity must be at least 1" });
        return;
      }
      if (!bogo_get_quantity || bogo_get_quantity < 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO get quantity must be at least 1" });
        return;
      }
      if (!bogo_discount_percentage || bogo_discount_percentage <= 0 || bogo_discount_percentage > 100) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO discount percentage must be between 1 and 100" });
        return;
      }
      // BOGO cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO coupons cannot include free shipping" });
        return;
      }
    }

    // Validation for free_shipping_only type
    if (discount_type === 'free_shipping_only') {
      // Must apply to all products
      if (applies_to_type !== 'all') {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping coupons must apply to all products" });
        return;
      }
      // Must have minimum purchase amount > 0
      if (!min_purchase_amount || min_purchase_amount <= 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping coupons require a minimum purchase amount greater than 0" });
        return;
      }
      // Cannot have discount_value
      if (discount_value) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping only coupons cannot have a discount value" });
        return;
      }
    }

    // Validation for fixed type
    if (discount_type === 'fixed') {
      // Must apply to all products
      if (applies_to_type !== 'all') {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount coupons must apply to all products" });
        return;
      }
      // Must have discount_value
      if (!discount_value || discount_value <= 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount requires a positive discount value" });
        return;
      }
      // Must have minimum purchase (5x rule)
      if (!min_purchase_amount || min_purchase_amount < discount_value * 5) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: `Fixed amount requires minimum purchase of at least $${(discount_value * 5).toFixed(2)} (5x the discount value)` });
        return;
      }
      // Cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount coupons cannot include free shipping" });
        return;
      }
    }

    // Validation for percentage type
    if (discount_type === 'percentage') {
      // Must have discount_value between 0-100
      if (!discount_value || discount_value <= 0 || discount_value > 100) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
        return;
      }
      // Cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Percentage coupons cannot include free shipping" });
        return;
      }
    }

    // Validation
    if (!coupon_code || !discount_type) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "Coupon code and discount type are required" });
      return;
    }

    if (!['percentage', 'fixed', 'bogo', 'free_shipping_only'].includes(discount_type)) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "Discount type must be 'percentage', 'fixed', 'bogo', or 'free_shipping_only'" });
      return;
    }

    if (!['all', 'category', 'product', 'product_type', 'variant', 'custom_group'].includes(applies_to_type)) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "Invalid applies_to_type" });
      return;
    }

    if (applies_to_type !== 'all' && applies_to_type !== 'custom_group' && !applies_to_id) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "applies_to_id is required when applies_to_type is not 'all' or 'custom_group'" });
      return;
    }
    
    // Validate custom_group has array of variant IDs
    if (applies_to_type === 'custom_group') {
      const variantIds = Array.isArray(applies_to_id) ? applies_to_id : [];
      if (variantIds.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Custom group must have at least one variant selected" });
        return;
      }
    }

    // Check if coupon code already exists
    const existingCoupon = await client.query(
      'SELECT coupon_id FROM coupons WHERE UPPER(coupon_code) = UPPER($1)',
      [coupon_code]
    );

    if (existingCoupon.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ message: "Coupon code already exists" });
      return;
    }

    // Auto-correct free_shipping flag based on discount_type
    let correctedFreeShipping = free_shipping || false;
    if (discount_type === 'free_shipping_only') {
      correctedFreeShipping = true; 
    } else if (discount_type === 'percentage' || discount_type === 'fixed' || discount_type === 'bogo') {
      correctedFreeShipping = false; 
    }

    // Auto-correct applies_to_type for fixed and free_shipping_only
    let correctedAppliesTo = applies_to_type;
    let correctedAppliesToId = applies_to_id;
    if (discount_type === 'fixed' || discount_type === 'free_shipping_only') {
      correctedAppliesTo = 'all';
      if (applies_to_type !== 'custom_group') {
        correctedAppliesToId = null;
      }
    }

    // Create the coupon (applies_to_id is NULL for custom_group)
    const result = await client.query(`
      INSERT INTO coupons (
        coupon_code, description, discount_type, discount_value,
        min_purchase_amount, max_discount_amount, free_shipping,
        applies_to_type, applies_to_id, usage_limit_total,
        usage_limit_per_user, requires_verified_email,
        valid_from, valid_until, is_active,
        bogo_buy_quantity, bogo_get_quantity, bogo_discount_percentage,
        location_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      coupon_code.toUpperCase(),
      description || null,
      discount_type,
      discount_value || null,
      min_purchase_amount || null,
      max_discount_amount || null,
      correctedFreeShipping,
      correctedAppliesTo || 'all',
      correctedAppliesTo === 'custom_group' ? null : (correctedAppliesToId || null),
      usage_limit_total || null,
      usage_limit_per_user || null,
      requires_verified_email || false,
      valid_from || new Date(),
      valid_until || null,
      is_active !== undefined ? is_active : true,
      discount_type === 'bogo' ? bogo_buy_quantity : null,
      discount_type === 'bogo' ? bogo_get_quantity : null,
      discount_type === 'bogo' ? bogo_discount_percentage : null,
      location_ids
    ]);

    const newCoupon = result.rows[0];

    // If custom_group, insert variant associations
    if (applies_to_type === 'custom_group' && Array.isArray(applies_to_id)) {
      for (const variantId of applies_to_id) {
        await client.query(
          'INSERT INTO coupon_variant_groups (coupon_id, variant_id) VALUES ($1, $2)',
          [newCoupon.coupon_id, variantId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(newCoupon);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating coupon:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// COUPONS - UPDATE
// ============================================================================

/**
 * UPDATE existing coupon
 */
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { couponId } = req.params;
    const {
      description,
      discount_type,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      free_shipping,
      applies_to_type,
      applies_to_id,
      usage_limit_total,
      usage_limit_per_user,
      requires_verified_email,
      valid_from,
      valid_until,
      is_active,
      bogo_buy_quantity,
      bogo_get_quantity,
      bogo_discount_percentage,
      location_ids
    } = req.body;

    // Check if coupon exists
    const existing = await client.query(
      'SELECT * FROM coupons WHERE coupon_id = $1',
      [couponId]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    // Validation for location_ids
    if (location_ids !== undefined && (!Array.isArray(location_ids) || location_ids.length === 0)) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: "At least one store location must be selected" });
      return;
    }

    // Validation for BOGO fields
    if (discount_type === 'bogo') {
      if (!bogo_buy_quantity || bogo_buy_quantity < 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO buy quantity must be at least 1" });
        return;
      }
      if (!bogo_get_quantity || bogo_get_quantity < 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO get quantity must be at least 1" });
        return;
      }
      if (!bogo_discount_percentage || bogo_discount_percentage <= 0 || bogo_discount_percentage > 100) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO discount percentage must be between 1 and 100" });
        return;
      }
      // BOGO cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "BOGO coupons cannot include free shipping" });
        return;
      }
    }

    // Validation for free_shipping_only type
    if (discount_type === 'free_shipping_only') {
      // Must apply to all products
      if (applies_to_type && applies_to_type !== 'all') {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping coupons must apply to all products" });
        return;
      }
      // Must have minimum purchase amount > 0
      if (min_purchase_amount !== undefined && (!min_purchase_amount || min_purchase_amount <= 0)) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping coupons require a minimum purchase amount greater than 0" });
        return;
      }
      // Cannot have discount_value
      if (discount_value !== undefined && discount_value) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Free shipping only coupons cannot have a discount value" });
        return;
      }
    }

    // Validation for fixed type
    if (discount_type === 'fixed') {
      // Must apply to all products
      if (applies_to_type && applies_to_type !== 'all') {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount coupons must apply to all products" });
        return;
      }
      // Must have discount_value
      if (discount_value !== undefined && (!discount_value || discount_value <= 0)) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount requires a positive discount value" });
        return;
      }
      // Must have minimum purchase (5x rule) - check both new and existing values
      const finalDiscountValue = discount_value !== undefined ? discount_value : existing.rows[0].discount_value;
      const finalMinPurchase = min_purchase_amount !== undefined ? min_purchase_amount : existing.rows[0].min_purchase_amount;
      if (finalDiscountValue && finalMinPurchase && finalMinPurchase < finalDiscountValue * 5) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: `Fixed amount requires minimum purchase of at least $${(finalDiscountValue * 5).toFixed(2)} (5x the discount value)` });
        return;
      }
      // Cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Fixed amount coupons cannot include free shipping" });
        return;
      }
    }

    // Validation for percentage type
    if (discount_type === 'percentage') {
      // Must have discount_value between 0-100
      if (discount_value !== undefined && (!discount_value || discount_value <= 0 || discount_value > 100)) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
        return;
      }
      // Cannot have free shipping
      if (free_shipping) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: "Percentage coupons cannot include free shipping" });
        return;
      }
    }

    // Auto-correct free_shipping flag based on discount_type
    let correctedFreeShipping = free_shipping;
    if (discount_type === 'free_shipping_only') {
      correctedFreeShipping = true; 
    } else if (discount_type === 'percentage' || discount_type === 'fixed' || discount_type === 'bogo') {
      correctedFreeShipping = false;
    }

    // Auto-correct applies_to_type for fixed and free_shipping_only
    let correctedAppliesTo = applies_to_type;
    let correctedAppliesToId = applies_to_id;
    if (discount_type === 'fixed' || discount_type === 'free_shipping_only') {
      correctedAppliesTo = 'all';
      if (applies_to_type !== 'custom_group') {
        correctedAppliesToId = null;
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description || null);
      paramCount++;
    }
    if (discount_type !== undefined) {
      updates.push(`discount_type = $${paramCount}`);
      values.push(discount_type);
      paramCount++;
    }
    if (discount_value !== undefined) {
      updates.push(`discount_value = $${paramCount}`);
      values.push(discount_value || null);
      paramCount++;
    }
    if (min_purchase_amount !== undefined) {
      updates.push(`min_purchase_amount = $${paramCount}`);
      values.push(min_purchase_amount || null);
      paramCount++;
    }
    if (max_discount_amount !== undefined) {
      updates.push(`max_discount_amount = $${paramCount}`);
      values.push(max_discount_amount || null);
      paramCount++;
    }
    if (correctedFreeShipping !== undefined) {
      updates.push(`free_shipping = $${paramCount}`);
      values.push(correctedFreeShipping);
      paramCount++;
    }
    if (correctedAppliesTo !== undefined) {
      updates.push(`applies_to_type = $${paramCount}`);
      values.push(correctedAppliesTo);
      paramCount++;
    }
    if (correctedAppliesToId !== undefined && correctedAppliesTo !== 'custom_group') {
      updates.push(`applies_to_id = $${paramCount}`);
      values.push(correctedAppliesToId || null);
      paramCount++;
    } else if (correctedAppliesTo === 'custom_group') {
      updates.push(`applies_to_id = NULL`);
    }
    if (usage_limit_total !== undefined) {
      updates.push(`usage_limit_total = $${paramCount}`);
      values.push(usage_limit_total || null);
      paramCount++;
    }
    if (usage_limit_per_user !== undefined) {
      updates.push(`usage_limit_per_user = $${paramCount}`);
      values.push(usage_limit_per_user || null);
      paramCount++;
    }
    if (requires_verified_email !== undefined) {
      updates.push(`requires_verified_email = $${paramCount}`);
      values.push(requires_verified_email);
      paramCount++;
    }
    if (valid_from !== undefined) {
      updates.push(`valid_from = $${paramCount}`);
      values.push(valid_from);
      paramCount++;
    }
    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramCount}`);
      values.push(valid_until || null);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    if (bogo_buy_quantity !== undefined) {
      updates.push(`bogo_buy_quantity = $${paramCount}`);
      values.push(discount_type === 'bogo' ? bogo_buy_quantity : null);
      paramCount++;
    }
    if (bogo_get_quantity !== undefined) {
      updates.push(`bogo_get_quantity = $${paramCount}`);
      values.push(discount_type === 'bogo' ? bogo_get_quantity : null);
      paramCount++;
    }
    if (bogo_discount_percentage !== undefined) {
      updates.push(`bogo_discount_percentage = $${paramCount}`);
      values.push(discount_type === 'bogo' ? bogo_discount_percentage : null);
      paramCount++;
    }
    if (location_ids !== undefined) {
      updates.push(`location_ids = $${paramCount}`);
      values.push(location_ids);
      paramCount++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'No fields to update' });
      return;
    }

    values.push(couponId);

    const result = await client.query(
      `UPDATE coupons 
       SET ${updates.join(', ')}
       WHERE coupon_id = $${paramCount}
       RETURNING *`,
      values
    );

    // If updating custom_group, update variant associations
    if (correctedAppliesTo === 'custom_group' && applies_to_id !== undefined) {
      // Delete existing associations
      await client.query(
        'DELETE FROM coupon_variant_groups WHERE coupon_id = $1',
        [couponId]
      );

      // Insert new associations
      if (Array.isArray(applies_to_id)) {
        for (const variantId of applies_to_id) {
          await client.query(
            'INSERT INTO coupon_variant_groups (coupon_id, variant_id) VALUES ($1, $2)',
            [couponId, variantId]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating coupon:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// COUPONS - DELETE
// ============================================================================

/**
 * DELETE coupon
 */
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    const result = await pool.query(
      'DELETE FROM coupons WHERE coupon_id = $1 RETURNING *',
      [couponId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// COUPONS - TOGGLE STATUS
// ============================================================================

/**
 * TOGGLE coupon active status
 */
export const toggleCouponStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      'UPDATE coupons SET is_active = $1 WHERE coupon_id = $2 RETURNING *',
      [is_active, couponId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// DROPDOWN DATA - CATEGORIES
// ============================================================================

/**
 * GET categories for coupon dropdown
 */
export const getCategoriesForCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT category_id, category_name
      FROM categories
      ORDER BY category_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// DROPDOWN DATA - PRODUCT TYPES
// ============================================================================

/**
 * GET product types for coupon dropdown
 */
export const getProductTypesForCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT product_type_id, type_name
      FROM product_types
      ORDER BY type_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching product types:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// DROPDOWN DATA - PRODUCTS
// ============================================================================

/**
 * GET products for coupon dropdown
 */
export const getProductsForCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT product_id, name
      FROM products
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// DROPDOWN DATA - LOCATIONS
// ============================================================================

/**
 * GET locations for coupon dropdown
 */
export const getLocationsForCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT location_id, location_name, state, city
      FROM seller_locations
      WHERE is_active = TRUE
      ORDER BY location_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PREVIEW - EXISTING COUPON
// ============================================================================

/**
 * GET preview of products affected by existing coupon
 */
export const previewCouponProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;

    // Get the coupon details
    const couponResult = await pool.query(
      'SELECT applies_to_type, applies_to_id, location_ids FROM coupons WHERE coupon_id = $1',
      [couponId]
    );

    if (couponResult.rows.length === 0) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    const { applies_to_type, applies_to_id, location_ids } = couponResult.rows[0];

    let productsQuery = '';
    let queryParams: any[] = [];

    // Build query based on applies_to_type
    if (applies_to_type === 'all') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pv.location_id = ANY($1)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [location_ids];
    } else if (applies_to_type === 'category') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN product_categories pc ON p.product_id = pc.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pc.category_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'product') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE p.product_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY pv.color, pv.size
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'product_type') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE p.product_type_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'variant') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pv.variant_id = $1
          AND pv.location_id = ANY($2)
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'custom_group') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN coupon_variant_groups cvg ON pv.variant_id = cvg.variant_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE cvg.coupon_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [couponId, location_ids];
    }

    const result = await pool.query(productsQuery, queryParams);

    res.json({ products: result.rows });
  } catch (error) {
    console.error("Error fetching coupon preview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PREVIEW - DRAFT COUPON
// ============================================================================

/**
 * GET preview of products for draft coupon (before creation)
 */
export const previewDraftCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applies_to_type, applies_to_id, location_ids } = req.query;

    if (!applies_to_type) {
      res.status(400).json({ message: 'applies_to_type is required' });
      return;
    }

    // Parse location_ids
    const locationIdsArray = location_ids 
      ? (location_ids as string).split(',').map(id => parseInt(id))
      : [];

    if (locationIdsArray.length === 0) {
      res.status(400).json({ message: 'At least one location must be selected' });
      return;
    }

    let productsQuery = '';
    let queryParams: any[] = [];

    // Build query based on applies_to_type
    if (applies_to_type === 'all') {
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pv.location_id = ANY($1)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [locationIdsArray];
    } else if (applies_to_type === 'category') {
      if (!applies_to_id) {
        res.status(400).json({ message: 'applies_to_id is required for category type' });
        return;
      }
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN product_categories pc ON p.product_id = pc.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pc.category_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [applies_to_id, locationIdsArray];
    } else if (applies_to_type === 'product') {
      if (!applies_to_id) {
        res.status(400).json({ message: 'applies_to_id is required for product type' });
        return;
      }
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE p.product_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY pv.color, pv.size
      `;
      queryParams = [applies_to_id, locationIdsArray];
    } else if (applies_to_type === 'product_type') {
      if (!applies_to_id) {
        res.status(400).json({ message: 'applies_to_id is required for product_type' });
        return;
      }
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE p.product_type_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [applies_to_id, locationIdsArray];
    } else if (applies_to_type === 'variant') {
      if (!applies_to_id) {
        res.status(400).json({ message: 'applies_to_id is required for variant type' });
        return;
      }
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pv.variant_id = $1
          AND pv.location_id = ANY($2)
      `;
      queryParams = [applies_to_id, locationIdsArray];
    } else if (applies_to_type === 'custom_group') {
      // For custom_group, applies_to_id should be a comma-separated list of variant IDs
      if (!applies_to_id) {
        res.status(400).json({ message: 'applies_to_id is required for custom_group type' });
        return;
      }
      
      let variantIds: number[];
      
      // Handle both JSON string and comma-separated string formats
      try {
        const idString = applies_to_id as string;
        
        // Try parsing as JSON first
        if (idString.startsWith('[')) {
          variantIds = JSON.parse(idString);
        } else {
          // Otherwise treat as comma-separated
          variantIds = idString.split(',').map(id => parseInt(id.trim()));
        }
      } catch (error) {
        res.status(400).json({ message: 'Invalid applies_to_id format for custom_group' });
        return;
      }
      
      productsQuery = `
        SELECT DISTINCT
          pv.variant_id,
          p.product_id,
          p.name as product_name,
          pv.color,
          pv.size,
          pv.price,
          pv.quantity,
          pv.location_id,
          pv.sku,
          sl.location_name,
          (
            SELECT pi.img_url 
            FROM product_images pi 
            WHERE pi.variant_id = pv.variant_id 
            ORDER BY pi.display_order 
            LIMIT 1
          ) as image_url
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN seller_locations sl ON pv.location_id = sl.location_id
        WHERE pv.variant_id = ANY($1)
          AND pv.location_id = ANY($2)
        ORDER BY p.name, pv.color, pv.size
      `;
      queryParams = [variantIds, locationIdsArray];
    } else {
      res.status(400).json({ message: 'Invalid applies_to_type' });
      return;
    }

    const result = await pool.query(productsQuery, queryParams);

    res.json({ products: result.rows });
  } catch (error) {
    console.error("Error fetching draft coupon preview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// UTILITY - GET ALL COUPON CODES
// ============================================================================

/**
 * GET all coupon codes for validation
 */
export const getAllCouponCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT coupon_code FROM coupons');
    const codes = result.rows.map(row => row.coupon_code);
    res.json(codes);
  } catch (error) {
    console.error("Error fetching coupon codes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// UTILITY - GET VARIANT INFO
// ============================================================================

/**
 * GET variant by ID (to get product_id for grouping)
 */
export const getVariantForCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;

    const result = await pool.query(
      `SELECT 
        pv.variant_id,
        pv.product_id,
        pv.color,
        pv.size,
        pv.price,
        p.name as product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.product_id
      WHERE pv.variant_id = $1`,
      [variantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Variant not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching variant:", error);
    res.status(500).json({ message: "Server error" });
  }
};