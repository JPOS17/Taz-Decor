import { useState, useEffect } from 'react';

type SKUPreviewFunction = (id: number) => Promise<string>;

export function useSKUPreview(id: number, fetchFunction: SKUPreviewFunction) {
  const [previewSKU, setPreviewSKU] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPreviewSKU = async () => {
      // If no valid ID (0 or negative), show placeholder
      if (!id || id <= 0) {
        setPreviewSKU('###-###-###');
        setLoading(false);
        return;
      }

      setLoading(true);
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