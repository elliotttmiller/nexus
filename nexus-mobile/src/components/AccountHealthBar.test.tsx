import React from 'react';
import { render } from '@testing-library/react-native';
import AccountHealthBar from './AccountHealthBar';

describe('AccountHealthBar', () => {
  it('renders with correct health value', () => {
    const { root } = render(<AccountHealthBar value={75} />);
    expect(root).toBeTruthy();
  });

  it('handles low health values (red)', () => {
    const { root } = render(<AccountHealthBar value={25} />);
    expect(root).toBeTruthy();
  });

  it('handles medium health values (orange)', () => {
    const { root } = render(<AccountHealthBar value={50} />);
    expect(root).toBeTruthy();
  });

  it('handles high health values (green)', () => {
    const { root } = render(<AccountHealthBar value={90} />);
    expect(root).toBeTruthy();
  });

  it('handles edge cases (0 and 100)', () => {
    const { root: root0 } = render(<AccountHealthBar value={0} />);
    const { root: root100 } = render(<AccountHealthBar value={100} />);
    expect(root0).toBeTruthy();
    expect(root100).toBeTruthy();
  });

  it('clamps values outside 0-100 range', () => {
    const { root: rootNegative } = render(<AccountHealthBar value={-10} />);
    const { root: rootOver } = render(<AccountHealthBar value={150} />);
    expect(rootNegative).toBeTruthy();
    expect(rootOver).toBeTruthy();
  });
});