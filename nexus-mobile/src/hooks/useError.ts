import { useState, useCallback } from 'react';

/**
 * useError - Custom hook for managing error state in async functions.
 *
 * Usage:
 *   const [error, setError, withError] = useError();
 *   const handleAction = () => withError(async () => { ... });
 *
 * This ensures errors are caught and set, and can be cleared easily.
 */
export default function useError(): [string | null, (err: string | null) => void, <T>(fn: () => Promise<T>) => Promise<T | undefined>] {
  const [error, setError] = useState<string | null>(null);

  // Wraps an async function, catches and sets error
  const withError = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (err: any) {
      setError(err?.message || 'An unknown error occurred.');
      return undefined;
    }
  }, []);

  return [error, setError, withError];
} 