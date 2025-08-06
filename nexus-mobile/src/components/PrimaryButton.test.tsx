import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PrimaryButton from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders correctly with title', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <PrimaryButton title="Test Button" onPress={mockOnPress} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <PrimaryButton title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <PrimaryButton title="Test Button" onPress={mockOnPress} disabled />
    );
    
    const button = getByText('Test Button').parent;
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies custom styles', () => {
    const mockOnPress = jest.fn();
    const customStyle = { backgroundColor: 'red' };
    const { getByText } = render(
      <PrimaryButton title="Test Button" onPress={mockOnPress} style={customStyle} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });
});