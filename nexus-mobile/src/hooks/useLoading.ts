import { useState, useCallback } from 'react';

/**
 * useLoading - Custom hook for managing loading state in async functions.
 *
 * Usage:
 *   const [loading, withLoading] = useLoading();
 *   const handleAction = () => withLoading(async () => { ... });
 *
 * This ensures loading is always set to false, even if an error occurs.
 */
export default function useLoading(initial: boolean = false): [boolean, <T>(fn: () => Promise<T>) => Promise<T>] {
  const [loading, setLoading] = useState(initial);

  // Wraps an async function, manages loading state automatically
  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, []);

  return [loading, withLoading];
} 