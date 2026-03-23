import { Pool, PoolClient } from "pg";

// ============================================================================
// SKU GENERATION - PRODUCT
// ============================================================================

/**
 * Generates the next SKU for a new product based on product type
 * Format: {PREFIX}-{PRODUCT_NUM}-{VARIANT_NUM}
 * Example: JRN-001-001
 */
export async function generateProductSKU(
  client: Pool | PoolClient, 
  productTypeId: number
): Promise<string> {

  // Get the SKU prefix from product_types table
  const typeResult = await client.query(`
    SELECT sku_prefix
    FROM product_types
    WHERE product_type_id = $1
  `, [productTypeId]);

  if (typeResult.rows.length === 0) {
    throw new Error('Invalid product type ID');
  }

  const prefix = typeResult.rows[0].sku_prefix;
  
  // Find the highest product number for this product type
  const result = await client.query(`
    SELECT pv.sku
    FROM product_variants pv
    JOIN products p ON p.product_id = pv.product_id
    WHERE p.product_type_id = $1
    AND pv.sku LIKE $2
    ORDER BY pv.sku DESC
    LIMIT 1
  `, [productTypeId, `${prefix}-%`]);

  let nextProductNum = 1;
  
  if (result.rows.length > 0) {
    const lastSKU = result.rows[0].sku;

    // Extract product number from SKU (e.g., "JRN-007-002" -> "007")
    const match = lastSKU.match(/^[A-Z]+-(\d{3})-\d{3}$/);

    if (match) {
      const lastProductNum = parseInt(match[1], 10);
      nextProductNum = lastProductNum + 1;
    }
  }

  // Format: XXX-001-001 (first variant of new product)
  const productNumStr = String(nextProductNum).padStart(3, '0');
  return `${prefix}-${productNumStr}-001`;
}

// ============================================================================
// SKU GENERATION - VARIANT
// ============================================================================

/**
 * Generates the next variant SKU for an existing product
 * Uses the product's existing SKU pattern
 */
export async function generateVariantSKU(
  client: Pool | PoolClient,
  productId: number
): Promise<string> {
  // Get product type to determine prefix
  const productResult = await client.query(`
    SELECT pt.sku_prefix
    FROM products p
    JOIN product_types pt ON pt.product_type_id = p.product_type_id
    WHERE p.product_id = $1
  `, [productId]);

  if (productResult.rows.length === 0) {
    throw new Error('Product not found or missing product type');
  }

  const prefix = productResult.rows[0].sku_prefix;
  
  // Find all existing variants for this product
  const result = await client.query(`
    SELECT sku
    FROM product_variants
    WHERE product_id = $1
    ORDER BY sku DESC
    LIMIT 1
  `, [productId]);

  if (result.rows.length === 0) {
    throw new Error('Product has no existing variants');
  }

  const existingSKU = result.rows[0].sku;
  
  // Extract product number and variant number
  const match = existingSKU.match(/^[A-Z]+-(\d{3})-(\d{3})$/);
  
  if (!match) {
    throw new Error('Invalid SKU format for existing variant');
  }

  const productNum = match[1]; // Keep the same product number
  const lastVariantNum = parseInt(match[2], 10);
  const nextVariantNum = lastVariantNum + 1;
  const variantNumStr = String(nextVariantNum).padStart(3, '0');

  return `${prefix}-${productNum}-${variantNumStr}`;
}