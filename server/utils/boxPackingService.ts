import { pool } from "../db";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Represents the dimensions of an item or box
 */
interface Dimensions {
  length_in: number;
  width_in: number;
  height_in: number;
}

/**
 * Represents an item to be packed
 */
interface PackingItem extends Dimensions {
  variant_id: number;
  quantity: number;
  product_name?: string;
}

/**
 * Represents a shipping box from the database
 */
export interface ShippingBox {
  box_id: number;
  box_name: string;
  length_in: number;
  width_in: number;
  height_in: number;
  box_type: "box" | "envelope";
  location_id: number;
  box_size_order: number;
  is_active: boolean;
}

// ============================================================================
// HELPER FUNCTIONS - DIMENSIONS
// ============================================================================

/**
 * Sort dimensions in descending order (largest to smallest)
 */
const sortDimensions = (dims: Dimensions): [number, number, number] => {
  return [dims.length_in, dims.width_in, dims.height_in].sort((a, b) => b - a) as [number, number, number];
};

/**
 * Check if an item can fit in a container
 * Both item and container dimensions are sorted before comparison
 * 
 * @param itemDims - Item dimensions
 * @param containerDims - Container dimensions
 * @param safetyMargin - Safety margin in inches (default 0.25)
 */
const canFitIn = (
  itemDims: Dimensions,
  containerDims: Dimensions,
  safetyMargin: number = 0.25
): boolean => {
  const [iL, iW, iH] = sortDimensions(itemDims);
  const [cL, cW, cH] = sortDimensions(containerDims);

  // Apply safety margin to container dimensions
  const effectiveLength = cL - safetyMargin;
  const effectiveWidth = cW - safetyMargin;
  const effectiveHeight = cH - safetyMargin;

  // Check if item fits when both are oriented optimally
  return iL <= effectiveLength && iW <= effectiveWidth && iH <= effectiveHeight;
};

// ============================================================================
// HELPER FUNCTIONS - ITEM CLASSIFICATION
// ============================================================================

/**
 * Check if order contains only flat items
 */
const isEnvelopeEligible = (items: PackingItem[]): boolean => {
  
  // Envelope items should have a height 0.5 or smaller
  const ENVELOPE_MAX_HEIGHT = 0.5;
  
  return items.every(item => {
    return (
      item.length_in === 0 ||
      item.width_in === 0 ||
      item.height_in === 0 ||
      (item.height_in <= ENVELOPE_MAX_HEIGHT && 
       item.length_in <= 12 && 
       item.width_in <= 9)
    );
  });
};

/**
 * Check if items contain a mix of flat and non-flat items
 */
const hasMixedItems = (items: PackingItem[]): boolean => {
  const ENVELOPE_MAX_HEIGHT = 0.5;
  
  let hasFlatItems = false;
  let hasNonFlatItems = false;

  for (const item of items) {
    if (
      item.length_in === 0 ||
      item.width_in === 0 ||
      item.height_in === 0 ||
      item.height_in <= ENVELOPE_MAX_HEIGHT
    ) {
      hasFlatItems = true;
    } else {
      hasNonFlatItems = true;
    }
  }

  return hasFlatItems && hasNonFlatItems;
};

// ============================================================================
// PACKING ALGORITHMS - STACKING CALCULATION
// ============================================================================

/**
 * Calculate bounding box for a specific stacking orientation
 * 
 * @param items - Array of items to pack
 * @param stackDimension - Which dimension to stack along ('height', 'width', or 'length')
 */
const calculateStackingOrientation = (
  items: Dimensions[],
  stackDimension: 'height' | 'width' | 'length'
): Dimensions => {
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;
  let totalStack = 0;

  for (const item of items) {
    // Sort each item's dimensions to get [largest, middle, smallest]
    const [dim1, dim2, dim3] = sortDimensions(item);

    if (stackDimension === 'height') {
      // Stack vertically: sum the smallest dimension, max of others
      maxLength = Math.max(maxLength, dim1);  // Largest
      maxWidth = Math.max(maxWidth, dim2);    // Middle
      totalStack += dim3;                      // Sum smallest (height)
    } else if (stackDimension === 'width') {
      // Stack side-by-side: sum the middle dimension
      maxLength = Math.max(maxLength, dim1);  // Largest
      totalStack += dim2;                      // Sum middle (width)
      maxHeight = Math.max(maxHeight, dim3);  // Smallest
    } else {
      // Stack end-to-end: sum the largest dimension
      totalStack += dim1;                      // Sum largest (length)
      maxWidth = Math.max(maxWidth, dim2);    // Middle
      maxHeight = Math.max(maxHeight, dim3);  // Smallest
    }
  }

  // Build result based on stacking dimension
  if (stackDimension === 'height') {
    return {
      length_in: maxLength,
      width_in: maxWidth,
      height_in: totalStack,
    };
  } else if (stackDimension === 'width') {
    return {
      length_in: maxLength,
      width_in: totalStack,
      height_in: maxHeight,
    };
  } else {
    return {
      length_in: totalStack,
      width_in: maxWidth,
      height_in: maxHeight,
    };
  }
};

/**
 * Try multiple stacking orientations to find the most efficient packing
 * 
 * 1. Stack by height (tallest dimension)
 * 2. Stack by width (middle dimension)
 * 3. Stack by length (longest dimension)
 * 
 * Returns the orientation that produces the smallest bounding box
 */
const calculateBoundingBox = (items: PackingItem[]): Dimensions => {
 
  if (items.length === 0) {
    return { length_in: 0, width_in: 0, height_in: 0 };
  }

  // For single item, just return its dimensions
  if (items.length === 1 && items[0].quantity === 1) {
    return {
      length_in: items[0].length_in,
      width_in: items[0].width_in,
      height_in: items[0].height_in,
    };
  }

  // Expand items by quantity (treat each as separate)
  const expandedItems: Dimensions[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      expandedItems.push({
        length_in: item.length_in,
        width_in: item.width_in,
        height_in: item.height_in,
      });
    }
  }

  // Sort all items by volume (largest first) for better packing
  expandedItems.sort((a, b) => {
    const volA = a.length_in * a.width_in * a.height_in;
    const volB = b.length_in * b.width_in * b.height_in;
    return volB - volA;
  });

  // Try all 3 stacking orientations and pick the best one
  const orientations = [
    calculateStackingOrientation(expandedItems, 'height'),  // Stack vertically (sum heights)
    calculateStackingOrientation(expandedItems, 'width'),   // Stack side-by-side (sum widths)
    calculateStackingOrientation(expandedItems, 'length'),  // Stack end-to-end (sum lengths)
  ];

  // Find the orientation with the smallest volume
  const bestOrientation = orientations.reduce((best, current) => {
    const bestVol = best.length_in * best.width_in * best.height_in;
    const currentVol = current.length_in * current.width_in * current.height_in;
    return currentVol < bestVol ? current : best;
  });

  console.log(`📐 Tested 3 orientations, best: ${bestOrientation.length_in}×${bestOrientation.width_in}×${bestOrientation.height_in}`);
  
  return bestOrientation;
};

// ============================================================================
// BOX SELECTION - MAIN ALGORITHM
// ============================================================================

/**
 * Select the optimal shipping box for the given items
 * 
 * Algorithm:
 * 1. If all items are flat (cards/stickers), use envelope
 * 2. If mixed items, use smallest box that fits
 * 3. Otherwise, calculate bounding box and find smallest fitting box
 * 4. If no box fits, use default large box
 * 
 * @param items - Array of items with dimensions and quantities
 * @param locationId - Seller location ID
 * @returns Selected shipping box or null if none found
 */
export const selectShippingBox = async (
  items: PackingItem[],
  locationId: number
): Promise<ShippingBox | null> => {
  try {
    console.log("📦 Starting box selection algorithm...");
    console.log(`📍 Location ID: ${locationId}`);
    console.log(`📋 Items to pack: ${JSON.stringify(items, null, 2)}`);

    // Fetch available boxes for this location, ordered by box_size_order
    const boxesResult = await pool.query<ShippingBox>(
      `SELECT 
        box_id,
        box_name,
        length_in,
        width_in,
        height_in,
        box_type,
        location_id,
        box_size_order,
        is_active
      FROM shipping_boxes
      WHERE location_id = $1 AND is_active = true
      ORDER BY box_size_order ASC`,
      [locationId]
    );

    const availableBoxes = boxesResult.rows;
    console.log(`📦 Available boxes: ${availableBoxes.length}`);
    console.log(`Boxes: ${JSON.stringify(availableBoxes.map(b => ({ name: b.box_name, order: b.box_size_order })), null, 2)}`);

    if (availableBoxes.length === 0) {
      console.error("❌ No active boxes found for this location");
      return null;
    }

    // Check if all items are envelope-eligible
    if (isEnvelopeEligible(items)) {
      console.log("✉️ All items are flat - envelope eligible");
      const envelope = availableBoxes.find(box => box.box_type === "envelope");
      if (envelope) {
        console.log(`✅ Selected envelope: ${envelope.box_name}`);
        return envelope;
      }
    }

    // If mixed items, must use a box
    if (hasMixedItems(items)) {
      console.log("📦 Mixed items detected - must use box (not envelope)");
    }

    // Filter to only boxes for 3D items
    const boxes = availableBoxes.filter(box => box.box_type === "box");
    
    if (boxes.length === 0) {
      console.error("❌ No boxes available (only envelopes)");
      return availableBoxes[0]; // Fallback to envelope if that's all we have
    }

    // Calculate the bounding box needed for all items
    const boundingBox = calculateBoundingBox(items);
    console.log(`📐 Calculated bounding box: ${JSON.stringify(boundingBox, null, 2)}`);

    // Find the smallest box that can fit the bounding box
    for (const box of boxes) {
      console.log(`🔍 Testing box: ${box.box_name} (${box.length_in}×${box.width_in}×${box.height_in})`);
      
      if (canFitIn(boundingBox, box)) {
        console.log(`✅ Items fit in ${box.box_name}`);
        return box;
      } else {
        console.log(`❌ Items don't fit in ${box.box_name}`);
      }
    }

    // If nothing fits, use the largest box as default
    const largestBox = boxes[boxes.length - 1]; 
    console.log(`⚠️ No box fits perfectly, using largest box: ${largestBox.box_name}`);
    return largestBox;

  } catch (error) {
    console.error("❌ Error selecting shipping box:", error);
    throw new Error(`Failed to select shipping box: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// ============================================================================
// BOX RETRIEVAL - GET BY ID
// ============================================================================

/**
 * Get a specific shipping box by ID
 */
export const getShippingBoxById = async (boxId: number): Promise<ShippingBox | null> => {
  try {
    const result = await pool.query<ShippingBox>(
      `SELECT 
        box_id,
        box_name,
        length_in,
        width_in,
        height_in,
        box_type,
        location_id,
        box_size_order,
        is_active
      FROM shipping_boxes
      WHERE box_id = $1`,
      [boxId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error fetching shipping box:", error);
    return null;
  }
};