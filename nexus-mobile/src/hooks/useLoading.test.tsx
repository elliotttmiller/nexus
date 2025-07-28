import { renderHook, act } from '@testing-library/react-native';
import useLoading from './useLoading';

describe('useLoading', () => {
  it('should toggle loading state correctly', async () => {
    const { result } = renderHook(() => useLoading());
    const [initialLoading, withLoading] = result.current;
    expect(initialLoading).toBe(false);

    await act(async () => {
      await withLoading(async () => {
        expect(result.current[0]).toBe(true);
        return 'done';
      });
    });
    expect(result.current[0]).toBe(false);
  });
}); 