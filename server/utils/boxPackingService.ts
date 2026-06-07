import { pool } from "../db";

interface Dimensions {
  length_in: number;
  width_in: number;
  height_in: number;
}

interface PackingItem extends Dimensions {
  variant_id: number;
  quantity: number;
  product_name?: string;
}

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

// Sorts all three dimensions largest-first so orientation comparisons are consistent
const sortDimensions = (dims: Dimensions): [number, number, number] => {
  return [dims.length_in, dims.width_in, dims.height_in].sort((a, b) => b - a) as [number, number, number];
};

// Returns true if the item fits inside the container after subtracting a safety margin (default 0.25in)
const canFitIn = (
  itemDims: Dimensions,
  containerDims: Dimensions,
  safetyMargin: number = 0.25
): boolean => {
  const [iL, iW, iH] = sortDimensions(itemDims);
  const [cL, cW, cH] = sortDimensions(containerDims);

  const effectiveLength = cL - safetyMargin;
  const effectiveWidth = cW - safetyMargin;
  const effectiveHeight = cH - safetyMargin;

  return iL <= effectiveLength && iW <= effectiveWidth && iH <= effectiveHeight;
};

// Returns true if every item in the cart qualifies for envelope shipping (height ≤ 0.5in and within flat mail dimensions)
const isEnvelopeEligible = (items: PackingItem[]): boolean => {
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

// Returns true if the cart contains both flat (envelope-eligible) and 3D items — used to force box selection
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

// Computes the bounding box for a list of items stacked along a single axis (height, width, or length)
const calculateStackingOrientation = (
  items: Dimensions[],
  stackDimension: 'height' | 'width' | 'length'
): Dimensions => {
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;
  let totalStack = 0;

  for (const item of items) {
    const [dim1, dim2, dim3] = sortDimensions(item);

    if (stackDimension === 'height') {
      // Stack vertically: sum the smallest dimension, max of the other two
      maxLength = Math.max(maxLength, dim1);
      maxWidth = Math.max(maxWidth, dim2);
      totalStack += dim3;
    } else if (stackDimension === 'width') {
      // Stack side-by-side: sum the middle dimension
      maxLength = Math.max(maxLength, dim1);
      totalStack += dim2;
      maxHeight = Math.max(maxHeight, dim3);
    } else {
      // Stack end-to-end: sum the largest dimension
      totalStack += dim1;
      maxWidth = Math.max(maxWidth, dim2);
      maxHeight = Math.max(maxHeight, dim3);
    }
  }

  if (stackDimension === 'height') {
    return { length_in: maxLength, width_in: maxWidth, height_in: totalStack };
  } else if (stackDimension === 'width') {
    return { length_in: maxLength, width_in: totalStack, height_in: maxHeight };
  } else {
    return { length_in: totalStack, width_in: maxWidth, height_in: maxHeight };
  }
};

// Expands items by quantity, tries all 3 stacking orientations, and returns the one with the smallest volume
const calculateBoundingBox = (items: PackingItem[]): Dimensions => {
  if (items.length === 0) {
    return { length_in: 0, width_in: 0, height_in: 0 };
  }

  if (items.length === 1 && items[0].quantity === 1) {
    return {
      length_in: items[0].length_in,
      width_in: items[0].width_in,
      height_in: items[0].height_in,
    };
  }

  // Flatten quantities into individual items for accurate packing simulation
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

  // Sort largest-first so the dominant items establish the base dimensions before smaller ones stack
  expandedItems.sort((a, b) => {
    const volA = a.length_in * a.width_in * a.height_in;
    const volB = b.length_in * b.width_in * b.height_in;
    return volB - volA;
  });

  const orientations = [
    calculateStackingOrientation(expandedItems, 'height'),
    calculateStackingOrientation(expandedItems, 'width'),
    calculateStackingOrientation(expandedItems, 'length'),
  ];

  const bestOrientation = orientations.reduce((best, current) => {
    const bestVol = best.length_in * best.width_in * best.height_in;
    const currentVol = current.length_in * current.width_in * current.height_in;
    return currentVol < bestVol ? current : best;
  });

  console.log(`📐 Tested 3 orientations, best: ${bestOrientation.length_in}×${bestOrientation.width_in}×${bestOrientation.height_in}`);

  return bestOrientation;
};

// Selects the smallest active shipping box for a given location that fits all items — returns null if no boxes exist
export const selectShippingBox = async (
  items: PackingItem[],
  locationId: number
): Promise<ShippingBox | null> => {
  try {
    console.log("📦 Starting box selection algorithm...");
    console.log(`📍 Location ID: ${locationId}`);
    console.log(`📋 Items to pack: ${JSON.stringify(items, null, 2)}`);

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

    // Prefer envelope if all items are flat
    if (isEnvelopeEligible(items)) {
      console.log("✉️ All items are flat - envelope eligible");
      const envelope = availableBoxes.find(box => box.box_type === "envelope");
      if (envelope) {
        console.log(`✅ Selected envelope: ${envelope.box_name}`);
        return envelope;
      }
    }

    // Mixed flat and 3D items must ship in a box regardless of individual item sizes
    if (hasMixedItems(items)) {
      console.log("📦 Mixed items detected - must use box (not envelope)");
    }

    const boxes = availableBoxes.filter(box => box.box_type === "box");

    if (boxes.length === 0) {
      console.error("❌ No boxes available (only envelopes)");
      return availableBoxes[0]; // Fallback to envelope if that's all available at this location
    }

    const boundingBox = calculateBoundingBox(items);
    console.log(`📐 Calculated bounding box: ${JSON.stringify(boundingBox, null, 2)}`);

    // Walk boxes in ascending size order and return the first one that fits
    for (const box of boxes) {
      console.log(`🔍 Testing box: ${box.box_name} (${box.length_in}×${box.width_in}×${box.height_in})`);

      if (canFitIn(boundingBox, box)) {
        console.log(`✅ Items fit in ${box.box_name}`);
        return box;
      } else {
        console.log(`❌ Items don't fit in ${box.box_name}`);
      }
    }

    // Nothing fit — return the largest box rather than failing the shipment
    const largestBox = boxes[boxes.length - 1];
    console.log(`⚠️ No box fits perfectly, using largest box: ${largestBox.box_name}`);
    return largestBox;

  } catch (error) {
    console.error("❌ Error selecting shipping box:", error);
    throw new Error(`Failed to select shipping box: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

// Fetches a single shipping box record by ID
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
