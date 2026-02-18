import { useState, useEffect } from 'react';
import { fetchWarehouseLocations, type Location } from '../api/sellerLocation';

export function useWarehouseLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await fetchWarehouseLocations();
        setLocations(data);
      } catch (err) {
        console.error('Error loading locations:', err);
        setError('Failed to load warehouse locations');
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  return { locations, loading, error };
}