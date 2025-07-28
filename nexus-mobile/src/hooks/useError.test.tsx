import { renderHook, act } from '@testing-library/react-native';
import useError from './useError';

describe('useError', () => {
  it('should set and clear error state', async () => {
    const { result } = renderHook(() => useError());
    const [initialError, setError, withError] = result.current;
    expect(initialError).toBeNull();

    act(() => {
      setError('Test error');
    });
    expect(result.current[0]).toBe('Test error');

    act(() => {
      setError(null);
    });
    expect(result.current[0]).toBeNull();
  });

  it('should catch errors in async functions', async () => {
    const { result } = renderHook(() => useError());
    const [_, __, withError] = result.current;

    await act(async () => {
      await withError(async () => {
        throw new Error('Async error');
      });
    });
    expect(result.current[0]).toBe('Async error');
  });
}); 