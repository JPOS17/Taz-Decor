import type { ValidationErrors } from './formValidator';

// Define the field order by section
const FIELD_ORDER = {
  productInfo: ['name', 'description', 'category_id', 'price', 'stock_quantity', 'location_id', 'sku'],
  productAttributes: ['color', 'size'],
  shippingInfo: ['weight_oz', 'length_in', 'width_in', 'height_in', 'package_dimensions']
};

// Scrolls to the first section that contains an error based on the defined field order
export const scrollToFirstErrorSection = (errors: ValidationErrors) => {

  if (Object.keys(errors).length === 0) return;

  let targetSection: string | null = null;

  // Walk each section in order and stop at the first one that has an error
  for (const field of FIELD_ORDER.productInfo) {
    if (errors[field]) {
      targetSection = 'product-info';
      break;
    }
  }

  if (!targetSection) {
    for (const field of FIELD_ORDER.productAttributes) {
      if (errors[field]) {
        targetSection = 'product-attributes';
        break;
      }
    }
  }

  if (!targetSection) {
    for (const field of FIELD_ORDER.shippingInfo) {
      if (errors[field]) {
        targetSection = 'shipping-info';
        break;
      }
    }
  }

  // Scroll to the target section, accounting for a fixed header offset
  if (targetSection) {
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section="${targetSection}"]`);
      
      if (sectionElement) {
        const headerOffset = 120; 
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