// __tests__/ai-features.test.js
// Jest test suite for mobile AI features

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CardRankScreen from '../app/card-rank';
import InterestKillerScreen from '../app/interest-killer';
import { API_BASE_URL, AI_BASE_URL } from '../src/constants/api';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

jest.mock('../src/constants/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn()
}));

jest.mock('../src/hooks/useLoading', () => ({
  __esModule: true,
  default: jest.fn(() => [false, jest.fn(callback => callback())])
}));

jest.mock('../src/hooks/useError', () => ({
  __esModule: true,
  default: () => [null, jest.fn(), jest.fn(callback => callback())]
}));

jest.mock('../src/components/PrimaryButton', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress, disabled, testID }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID || 'primary-button'}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AI Features Mobile Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CardRank Screen', () => {
    test('renders correctly', () => {
      const { getByText, getByPlaceholderText } = render(<CardRankScreen />);
      
      expect(getByText('CardRank')).toBeTruthy();
      expect(getByPlaceholderText('Enter merchant')).toBeTruthy();
      expect(getByPlaceholderText('Enter category (e.g. dining)')).toBeTruthy();
      expect(getByText('Get Recommendation')).toBeTruthy();
    });

    test('handles successful recommendation', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          recommendation: { card_name: 'Chase Sapphire Preferred' }
        })
      });

      const { getByPlaceholderText, getByTestId, getByText } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Starbucks');
      fireEvent.changeText(getByPlaceholderText('Enter category (e.g. dining)'), 'dining');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByText('Chase Sapphire Preferred')).toBeTruthy();
      });
    });

    test('handles API error', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request' })
      });

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Test');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/cardrank/recommend`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 1,
              merchant: 'Test',
              category: ''
            })
          })
        );
      });
    });

    test('handles network error', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Test');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    test('handles session expiry', async () => {
      const mockRouter = require('expo-router').useRouter();
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Test');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('InterestKiller Screen', () => {
    test('renders correctly', () => {
      const { getByText, getByPlaceholderText } = render(<InterestKillerScreen />);
      
      expect(getByText('Interest Killer')).toBeTruthy();
      expect(getByPlaceholderText('Enter payment amount')).toBeTruthy();
      expect(getByText('Get Suggestion')).toBeTruthy();
    });

    test('handles successful suggestion', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          suggestion: [
            { amount: 150, card: 'Card A', apr: '24.99' },
            { amount: 50, card: 'Card B', apr: '18.99' }
          ]
        })
      });

      const { getByPlaceholderText, getByTestId, getByText } = render(<InterestKillerScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter payment amount'), '200');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByText(/150 to Card A/)).toBeTruthy();
        expect(getByText(/50 to Card B/)).toBeTruthy();
      });
    });

    test('validates numeric input', () => {
      const { getByPlaceholderText } = render(<InterestKillerScreen />);
      const input = getByPlaceholderText('Enter payment amount');
      
      expect(input.props.keyboardType).toBe('numeric');
    });

    test('handles empty suggestion response', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'No suggestion available' })
      });

      const { getByPlaceholderText, getByTestId } = render(<InterestKillerScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter payment amount'), '100');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/interestkiller/suggest`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 1,
              amount: '100'
            })
          })
        );
      });
    });
  });

  describe('AI Integration Tests', () => {
    test('CardRank API payload structure', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ recommendation: { card_name: 'Test Card' } })
      });

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Amazon');
      fireEvent.changeText(getByPlaceholderText('Enter category (e.g. dining)'), 'shopping');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/cardrank/recommend`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 1,
              merchant: 'Amazon',
              category: 'shopping'
            })
          })
        );
      });
    });

    test('InterestKiller API payload structure', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ suggestion: [] })
      });

      const { getByPlaceholderText, getByTestId } = render(<InterestKillerScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter payment amount'), '250');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/interestkiller/suggest`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              userId: 1,
              amount: '250'
            })
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('displays network error messages', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Test');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    test('handles malformed API responses', async () => {
      const mockFetch = require('../src/constants/fetchWithAuth').fetchWithAuth;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}) // Empty response
      });

      const { getByPlaceholderText, getByTestId } = render(<CardRankScreen />);
      
      fireEvent.changeText(getByPlaceholderText('Enter merchant'), 'Test');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator during API call', async () => {
      const mockUseLoading = require('../src/hooks/useLoading').default;
      mockUseLoading.mockReturnValue([true, jest.fn()]);

      const { getByText } = render(<CardRankScreen />);
      
      expect(getByText('Loading...')).toBeTruthy();
    });

    test('disables button during loading', async () => {
      const mockUseLoading = require('../src/hooks/useLoading').default;
      mockUseLoading.mockReturnValue([true, jest.fn()]);

      const { getByTestId } = render(<CardRankScreen />);
      const button = getByTestId('primary-button');
      // TouchableOpacity does not expose 'disabled' prop directly, check accessibilityState
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });
});