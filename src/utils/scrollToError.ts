import type { ValidationErrors } from './formValidator';

// Define the field order by section
const FIELD_ORDER = {
  productInfo: ['name', 'description', 'category_id', 'price', 'stock_quantity', 'location_id', 'sku'],
  productAttributes: ['color', 'size'],
  shippingInfo: ['weight_oz', 'length_in', 'width_in', 'height_in', 'package_dimensions']
};

export const scrollToFirstErrorSection = (errors: ValidationErrors) => {
  if (Object.keys(errors).length === 0) return;

  // Determine which section has the first error
  let targetSection: string | null = null;

  // Check product info fields first
  for (const field of FIELD_ORDER.productInfo) {
    if (errors[field]) {
      targetSection = 'product-info';
      break;
    }
  }

  // If no error in product info, check attributes
  if (!targetSection) {
    for (const field of FIELD_ORDER.productAttributes) {
      if (errors[field]) {
        targetSection = 'product-attributes';
        break;
      }
    }
  }

  // If no error in attributes, check shipping
  if (!targetSection) {
    for (const field of FIELD_ORDER.shippingInfo) {
      if (errors[field]) {
        targetSection = 'shipping-info';
        break;
      }
    }
  }

  // Scroll to the section
  if (targetSection) {
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section="${targetSection}"]`);
      
      if (sectionElement) {
        const headerOffset = 120; // Account for sticky header
        const elementPosition = sectionElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }
};