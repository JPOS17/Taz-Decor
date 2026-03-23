import * as shippo from "shippo";

// ============================================================================
// SHIPPO CLIENT INITIALIZATION
// ============================================================================

/**
 * Initialize Shippo client for SDK v2
 */
const shippoClient = new shippo.Shippo({
  apiKeyHeader: process.env.SHIPPO_API_KEY || "",
});

// ============================================================================
// CONSTANTS - ORIGIN ADDRESS
// ============================================================================

/**
 * Your Texas shop address (location_id = 1)
 */
const ORIGIN_ADDRESS = {
  name: "Martha Salas",
  company: "Texas Shop",
  street1: "107 Resilient Gale Ct",
  city: "Magnolia",
  state: "TX",
  zip: "77354",
  country: "US",
  phone: "2812483393",
};

// ============================================================================
// INTERFACES
// ============================================================================

interface ShippingItem {
  weight_oz: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
}

interface DestinationAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  service_level_name: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
  rate_id: string;
  carrier_account: string;
}

export interface AddressValidationInput {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AddressValidationResult {
  is_valid: boolean;
  validation_results: {
    is_valid: boolean;
    messages: Array<{
      source?: string;
      code?: string;
      type?: string;
      text?: string;
    }>;
  };
  original_address: AddressValidationInput;
  validated_address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

/**
 * Box dimensions for shipping rate calculation
 */
export interface BoxDimensions {
  length_in: number;
  width_in: number;
  height_in: number;
  box_name?: string;
}

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

/**
 * Validate a U.S. address using Shippo (FREE for U.S. addresses)
 */
export const validateAddress = async (
  address: AddressValidationInput
): Promise<AddressValidationResult> => {
  try {
    console.log("🔍 Validating address:", JSON.stringify(address, null, 2));

    // Only validate U.S. addresses
    if (address.country !== "US" && address.country !== "USA") {
      throw new Error("Address validation is only available for U.S. addresses");
    }

    // Create address validation request
    const validationResponse = await shippoClient.addresses.create({
      name: address.name,
      street1: address.street1,
      street2: address.street2 || "",
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: "US",
      validate: true,
    });

    console.log("✅ Validation response:", JSON.stringify(validationResponse, null, 2));

    const validationResults = validationResponse.validationResults;
    const isValid = validationResults?.isValid || false;

    const result: AddressValidationResult = {
      is_valid: isValid,
      validation_results: {
        is_valid: isValid,
        messages: validationResults?.messages || [],
      },
      // Return original address in the same format it was sent
      original_address: {
        name: address.name,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
      },
    };

    // If valid, include the validated/corrected address
    if (isValid && validationResponse) {
      result.validated_address = {
        street1: validationResponse.street1 || address.street1,
        street2: validationResponse.street2 || address.street2 || "",
        city: validationResponse.city || address.city,
        state: validationResponse.state || address.state,
        zip: validationResponse.zip || address.zip,
        country: "US",
      };
    }

    return result;
  } catch (error: any) {
    console.error("❌ Address validation error:", error);
    throw new Error(
      `Failed to validate address: ${error.message || "Unknown error"}`
    );
  }
};

// ============================================================================
// SHIPPING RATES
// ============================================================================

/**
 * Get real-time shipping rates from multiple carriers
 * Now accepts optional box dimensions from the packing algorithm
 */
export const getRealTimeShippingRates = async (
  items: ShippingItem[],
  destinationAddress: DestinationAddress,
  selectedBox?: BoxDimensions
): Promise<ShippingRate[]> => {
  try {
    console.log("🚀 Starting shipping rate calculation...");
    console.log("📦 Items:", JSON.stringify(items, null, 2));
    console.log("📍 Destination:", JSON.stringify(destinationAddress, null, 2));
    if (selectedBox) {
      console.log("📦 Using selected box:", JSON.stringify(selectedBox, null, 2));
    }

    // Calculate total weight and determine if we need dimensional weight
    const totalWeightOz = items.reduce((sum, item) => sum + item.weight_oz, 0);
    const totalWeightLbs = totalWeightOz / 16;

    console.log(`⚖️ Total weight: ${totalWeightOz}oz (${totalWeightLbs.toFixed(2)}lbs)`);

    // Create parcel object
    let parcel: any = {
      weight: totalWeightLbs.toFixed(2),
      massUnit: "lb",
    };

    // Use the selected box dimensions (from packing algorithm)
    if (selectedBox) {
      parcel = {
        ...parcel,
        length: selectedBox.length_in.toFixed(2),
        width: selectedBox.width_in.toFixed(2),
        height: selectedBox.height_in.toFixed(2),
        distanceUnit: "in",
      };
      console.log(`📦 Using box: ${selectedBox.box_name || 'Custom box'} (${selectedBox.length_in}×${selectedBox.width_in}×${selectedBox.height_in})`);
    } else {
      // Fallback to default dimensions if no box selected
      parcel = {
        ...parcel,
        length: "12",
        width: "8",
        height: "6",
        distanceUnit: "in",
      };
      console.log("⚠️ No box selected, using default dimensions");
    }

    console.log("📦 Parcel config:", JSON.stringify(parcel, null, 2));

    // Create shipment to get rates
    console.log("🌐 Calling Shippo API...");
    const shipment = await shippoClient.shipments.create({
      addressFrom: ORIGIN_ADDRESS,
      addressTo: {
        name: destinationAddress.name,
        street1: destinationAddress.street1,
        street2: destinationAddress.street2 || "",
        city: destinationAddress.city,
        state: destinationAddress.state,
        zip: destinationAddress.zip,
        country: destinationAddress.country,
        phone: destinationAddress.phone || "",
      },
      parcels: [parcel],
      async: false, // Get rates synchronously
    });

    console.log("✅ Shippo API response received");
    console.log("📊 Number of rates returned:", shipment.rates?.length || 0);

    console.log("🔍 Raw rates:", JSON.stringify(shipment.rates?.map((r: any) => ({
      provider: r.provider,
      token: r.servicelevel?.token,
      amount: r.amount
    })), null, 2));

    // Filter and format rates
    const rates: ShippingRate[] = (shipment.rates || [])
      .filter((rate: any) => {
        // Filter out rates with errors or missing required fields
        if (!rate.amount || !rate.provider || !rate.objectId) {
          return false;
        }
        
        // Only show USPS carriers
        if (rate.provider !== "USPS") {
          return false;
        }
        
        // Show only affordable USPS options
        const allowedServices = [
          "usps_ground_advantage",
          "usps_priority",
          "usps_priority_express"
        ];
        
        return allowedServices.includes(rate.servicelevel?.token);
      })
      .map((rate: any) => ({
        carrier: rate.provider || "",
        service: rate.servicelevel?.token || "",
        service_level_name: rate.servicelevel?.name || "",
        amount: rate.amount || "0",
        currency: rate.currency || "USD",
        estimated_days: rate.estimatedDays || null,
        rate_id: rate.objectId || "",
        carrier_account: rate.carrierAccount || "",
      }))
      .sort((a: ShippingRate, b: ShippingRate) => parseFloat(a.amount) - parseFloat(b.amount));

    console.log(`✅ Filtered to ${rates.length} available rates`);
    console.log("💰 Rates:", JSON.stringify(rates, null, 2));

    return rates;
  } catch (error: any) {
    console.error("❌ Shippo API Error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to get shipping rates: ${error.message || "Unknown error"}`
    );
  }
};
