import { renderHook, act, waitFor } from '@testing-library/react-native';
import useLoading from './useLoading';

describe('useLoading', () => {
  it('should toggle loading state correctly', async () => {
    const { result } = renderHook(() => useLoading());
    const [initialLoading, withLoading] = result.current;
    expect(initialLoading).toBe(false);

    // Start the async operation without awaiting immediately
    let promise: Promise<string>;
    act(() => {
      promise = withLoading(async () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve('done'), 10);
        });
      });
    });
    
    // Wait for loading state to be set to true
    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
    
    // Now wait for the promise to complete
    await act(async () => {
      await promise!;
    });
    
    // After completion, loading should be false
    expect(result.current[0]).toBe(false);
  });
}); 