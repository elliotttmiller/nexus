# Nexus Mobile AI Test Suite

## Overview

This comprehensive test suite ensures that all AI features in the Nexus mobile application are fully optimized, configured, and functioning correctly. The test suite covers end-to-end integration, unit testing, and performance validation for all AI-powered features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run complete AI test suite
npm run test:ai

# Run specific test types
npm run test:ai:e2e          # End-to-end tests only
npm run test:ai:unit         # Unit tests only
npm run test:ai:performance  # Performance tests only

# Health check
npm run test:ai:health
```

## 🧪 Test Suite Components

### 1. End-to-End Tests (`e2e-ai-test-suite.js`)

**Purpose**: Tests complete AI workflows from mobile app to backend to AI service

**Features Tested**:
- CardRank AI recommendations
- InterestKiller payment optimization
- Spending Insights analysis
- Authentication flows
- Error handling and recovery

**Test Scenarios**:
- ✅ Basic AI feature functionality
- ✅ Edge cases (empty data, invalid inputs)
- ✅ Authentication and session management
- ✅ API error handling
- ✅ Response format validation

### 2. Unit Tests (`__tests__/ai-features.test.js`)

**Purpose**: Tests individual mobile components and their AI integrations

**Components Tested**:
- CardRank screen component
- InterestKiller screen component
- API payload structures
- Error state handling
- Loading states

**Test Coverage**:
- ✅ Component rendering
- ✅ User interactions
- ✅ API call formatting
- ✅ Response handling
- ✅ Error scenarios

### 3. Performance Tests (`__tests__/ai-performance.test.js`)

**Purpose**: Validates AI service performance and optimization

**Metrics Tested**:
- Response times (< 5 seconds for AI endpoints)
- Memory usage and leak detection
- Concurrent request handling
- Error recovery performance
- Large dataset processing

**Performance Targets**:
- CardRank: < 3 seconds (target), < 5 seconds (max)
- InterestKiller: < 4 seconds (target), < 6 seconds (max)
- Spending Insights: < 2 seconds (target), < 3 seconds (max)

## 🔧 Configuration

### Environment Configuration (`ai-test-config.json`)

The test suite supports multiple environments:

```json
{
  "environments": {
    "development": {
      "backend_url": "http://localhost:3000/api",
      "ai_service_url": "http://localhost:8000"
    },
    "production": {
      "backend_url": "https://nexus-production-2e34.up.railway.app/api",
      "ai_service_url": "https://nexus-ai-production.up.railway.app"
    }
  }
}
```

### Running Tests Against Different Environments

```bash
# Development environment
npm run test:ai:dev

# Staging environment
npm run test:ai:staging

# Production environment
npm run test:ai:prod
```

## 📊 AI Features Tested

### CardRank AI
- **Endpoint**: `/api/cardrank/recommend`
- **Tests**: 
  - Basic recommendations for shopping, dining, travel
  - Edge cases (no cards, invalid categories)
  - Response format validation
  - Performance benchmarks

### InterestKiller AI
- **Endpoint**: `/api/interestkiller/suggest`
- **Tests**:
  - Payment optimization algorithms
  - Multiple account scenarios
  - Re-explain functionality
  - Complex account structures

### Spending Insights AI
- **Endpoint**: `/api/spending-insights`
- **Tests**:
  - Transaction categorization
  - Spending pattern analysis
  - Month-over-month comparisons
  - Large dataset processing

## 🎯 Test Execution Flow

1. **Setup Phase**
   - Create test user account
   - Authenticate and obtain tokens
   - Validate environment connectivity

2. **AI Feature Testing**
   - Test each AI endpoint with various scenarios
   - Validate response formats and content
   - Check error handling

3. **Mobile Integration Testing**
   - Test mobile app components
   - Validate API integration
   - Check authentication flows

4. **Performance Testing**
   - Measure response times
   - Test concurrent requests
   - Monitor memory usage

5. **Reporting**
   - Generate comprehensive test report
   - Provide optimization recommendations
   - Save results to `test-report.json`

## 📈 Test Results and Reporting

### Sample Test Report

```json
{
  "summary": {
    "total_tests": 45,
    "passed": 43,
    "failed": 2,
    "success_rate": "95.56%",
    "total_duration_ms": 125000
  },
  "details": {
    "e2e_tests": { "passed": 15, "failed": 1 },
    "unit_tests": { "passed": 25, "failed": 0 },
    "performance_tests": { "passed": 3, "failed": 1 }
  },
  "recommendations": [
    "All tests passed! AI features are fully optimized and configured."
  ]
}
```

### Understanding Results

- **Success Rate**: Percentage of tests that passed
- **Duration**: Total time for all test suites
- **Recommendations**: Actionable insights for improvements

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failures**
   ```bash
   # Check API connectivity
   npm run test:ai:health
   ```

2. **Timeout Errors**
   - Increase timeout in `ai-test-config.json`
   - Check network connectivity to AI services

3. **Performance Test Failures**
   - AI services may be under load
   - Check service status and retry

### Debug Mode

```bash
# Run with verbose logging
DEBUG=true npm run test:ai
```

## 🔄 Continuous Integration

### GitHub Actions Integration

```yaml
name: AI Test Suite
on: [push, pull_request]
jobs:
  ai-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:ai:prod
```

### Test Coverage Requirements

- Unit Tests: > 80% coverage
- E2E Tests: All critical AI flows
- Performance Tests: All AI endpoints

## 📝 Adding New Tests

### Adding a New AI Feature Test

1. **Update Configuration** (`ai-test-config.json`):
```json
{
  "aiFeatures": {
    "newFeature": {
      "testCases": [
        {
          "name": "Basic Test",
          "payload": { "data": "test" },
          "expectedFields": ["result"]
        }
      ]
    }
  }
}
```

2. **Add E2E Test** (`e2e-ai-test-suite.js`):
```javascript
async testNewFeatureAI() {
  // Test implementation
}
```

3. **Add Unit Test** (`__tests__/ai-features.test.js`):
```javascript
describe('New Feature', () => {
  test('renders correctly', () => {
    // Test implementation
  });
});
```

## 🎯 Best Practices

1. **Test Data Management**
   - Use unique test data for each run
   - Clean up test data after execution
   - Avoid hardcoded values

2. **Error Handling**
   - Test both success and failure scenarios
   - Validate error messages and codes
   - Test recovery mechanisms

3. **Performance Testing**
   - Test with realistic data volumes
   - Monitor memory usage
   - Test concurrent scenarios

4. **Maintenance**
   - Update tests when AI features change
   - Review and update performance targets
   - Keep test dependencies current

## 🔗 Related Documentation

- [Nexus System Architecture](../NEXUS-SYSTEM-ARCHITECTURE-DEVELOPER%20GUIDE.txt)
- [Backend API Documentation](../nexus-backend/README.md)
- [AI Service Documentation](../nexus-ai/README.md)

## 📞 Support

For issues with the test suite:
1. Check the troubleshooting section above
2. Review test logs in `test-report.json`
3. Run health check: `npm run test:ai:health`
4. Contact the development team with specific error details

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Nexus Development Team