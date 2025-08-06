import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import PlaidErrorBoundary from './PlaidErrorBoundary';

// Mock component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for Plaid');
  }
  return <Text>Normal component</Text>;
};

describe('PlaidErrorBoundary', () => {
  // Suppress console.error during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <PlaidErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </PlaidErrorBoundary>
    );

    expect(getByText('Normal component')).toBeTruthy();
  });

  it('should catch errors and display error boundary UI', () => {
    const { getByText } = render(
      <PlaidErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </PlaidErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/We encountered an issue with the banking integration/)).toBeTruthy();
    expect(getByText('Error: Test error for Plaid')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should render custom fallback UI when provided', () => {
    const customFallback = <Text>Custom error message</Text>;
    const { getByText, queryByText } = render(
      <PlaidErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </PlaidErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });
});