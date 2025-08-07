import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '../../../app/login';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock constants
jest.mock('../../constants/api', () => ({
  API_BASE_URL: 'https://nexus-production-2e34.up.railway.app',
}));

// Mock token functions
jest.mock('../../constants/token', () => ({
  saveToken: jest.fn(),
  saveRefreshToken: jest.fn(),
  removeToken: jest.fn(),
  removeRefreshToken: jest.fn(),
}));

describe('LoginScreen', () => {
  it('renders login form correctly', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText('Welcome to Nexus Ai')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Register')).toBeTruthy();
  });

  it('displays API base URL for debugging', () => {
    render(<LoginScreen />);
    
    expect(screen.getByText('API: https://nexus-production-2e34.up.railway.app')).toBeTruthy();
  });
});