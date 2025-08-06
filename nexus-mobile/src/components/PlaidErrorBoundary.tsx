import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PRIMARY } from '../constants/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class PlaidErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('PlaidErrorBoundary caught an error:', error, errorInfo);
    
    // You can also send this to your error reporting service
    // Example: crashlytics().recordError(error);
  }

  resetError = () => {
    this.setState({ hasError: false, errorMessage: '' });
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an issue with the banking integration. This might be a temporary problem.
          </Text>
          <Text style={styles.errorDetails}>
            Error: {this.state.errorMessage}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.resetError}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});