import { useState, useEffect } from 'react';

// A generic function type that takes an ID and resolves to a SKU string
type SKUPreviewFunction = (id: number) => Promise<string>;

// Custom hook to fetch and manage a preview SKU based on a given ID
export function useSKUPreview(id: number, fetchFunction: SKUPreviewFunction) {
  const [previewSKU, setPreviewSKU] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Loads the preview SKU whenever the ID or fetch function changes; shows a placeholder for invalid IDs and handles loading state
  useEffect(() => {
    const loadPreviewSKU = async () => {
      // Show a placeholder if no valid ID has been selected yet
      if (!id || id <= 0) {
        setPreviewSKU('###-###-###');
        setLoading(false);
        return;
      }

      setLoading(true);

      // Attempt to fetch the SKU using the provided function, handling any errors that occur
      try {
        const sku = await fetchFunction(id);
        setPreviewSKU(sku);
      } catch (error) {
        console.error('Error loading preview SKU:', error);
        setPreviewSKU('Error loading SKU');
      } finally {
        setLoading(false);
      }
    };

    loadPreviewSKU();
  }, [id, fetchFunction]);

  return { previewSKU, loading };
}