# Plaid Sandbox User Flow Test Suite

This test suite automates testing of all Plaid sandbox user flows and validates both backend integration and AI features.

## Overview

The test suite covers all the sandbox user scenarios from Plaid's documentation:
- Basic account linking flows
- Transaction testing flows  
- Auth micro-deposit flows
- Credit and income testing flows
- Multi-factor authentication (MFA) flows
- Error simulation flows
- ReCAPTCHA testing flows

## Test Coverage

### ✅ Basic Flows
- `user_good` / `pass_good` - Basic account linking
- `user_transactions_dynamic` - Transactions testing with realistic data

### ✅ Auth Flows  
- `user_good` / `microdeposits_good` - Micro-deposit/ACH testing

### ✅ Credit & Income Flows
- `user_credit_profile_excellent` - Excellent credit profile
- `user_credit_profile_good` - Good credit profile  
- `user_credit_profile_poor` - Poor credit profile
- `user_credit_bonus` - Bonus income streams
- `user_credit_joint_account` - Joint account testing
- `user_bank_income` - Bank income verification

### ✅ MFA Flows
- `user_good` / `mfa_device` - Device OTP authentication
- `user_good` / `mfa_questions_1_2` - Security questions
- `user_good` / `mfa_selections` - Selection-based MFA

### ✅ Error Flows (Expected to fail gracefully)
- `user_good` / `error_ITEM_LOCKED` - Item locked error
- `user_good` / `error_INVALID_CREDENTIALS` - Invalid credentials
- `user_good` / `error_INSTITUTION_DOWN` - Institution down error

### ✅ ReCAPTCHA Flows
- `user_good` / `{"recaptcha":"bad"}` - ReCAPTCHA failure simulation

## Files

- `plaid_integration_test.py` - Main test implementation
- `run_plaid_tests.py` - CI/CD test runner with reporting
- `run_local_tests.py` - Simple local test runner
- `requirements.txt` - Python dependencies
- `README.md` - This documentation

## Usage

### Local Development

1. Install dependencies:
```bash
cd nexus-backend/tests/plaid
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export PLAID_CLIENT_ID="your_client_id"
export PLAID_SECRET="your_secret"
export BACKEND_URL="http://localhost:8080"
```

3. Run tests:
```bash
# Simple local runner
python run_local_tests.py

# Or run the main test directly
python plaid_integration_test.py

# Or use the full runner with options
python run_plaid_tests.py --env local --verbose --report test-report.txt
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/plaid-tests.yml`) automatically runs:

- On every push to `main` or `develop` branches
- On pull requests
- Daily at 2 AM UTC (scheduled)
- Manually via workflow dispatch

### Environment Options

- `--env local` - Test against localhost:8080
- `--env staging` - Test against staging environment  
- `--env production` - Test against production environment

### Output Options

- `--verbose` - Enable detailed logging
- `--report filename.txt` - Save detailed report to file
- `--json filename.json` - Save JSON results to file

## Test Results

Each test provides:
- ✅/❌ Success/failure status
- Response time measurement
- Account fetching validation
- AI feature testing (CardRank, InterestKiller)
- Detailed error messages

## AI Feature Validation

For successful account connections, the test suite validates:
- **CardRank** - Credit card recommendation engine
- **InterestKiller** - Interest optimization suggestions

Both AI features are tested with realistic transaction data to ensure they're working correctly.

## Troubleshooting

### Common Issues

1. **Backend not running**
   - Ensure your backend is running on the expected URL
   - Check the `BACKEND_URL` environment variable

2. **Plaid credentials**
   - Verify your Plaid sandbox credentials are correct
   - Check `PLAID_CLIENT_ID` and `PLAID_SECRET` environment variables

3. **Network issues**
   - Ensure you can reach both your backend and Plaid's sandbox API
   - Check firewall/proxy settings

4. **Rate limiting**
   - Tests include 1-second delays between requests
   - If you hit rate limits, increase the delay in the test code

### Debug Mode

Run with verbose logging to see detailed information:
```bash
python run_plaid_tests.py --verbose
```

## Integration with CI/CD

The test suite is designed to integrate seamlessly with CI/CD pipelines:

- **Exit codes**: 0 for success, 1 for failure
- **JSON output**: Machine-readable results for automation
- **Artifacts**: Test reports and results are saved as build artifacts
- **Notifications**: Failed tests trigger notifications
- **PR comments**: Test results are posted to pull requests

## Contributing

When adding new Plaid sandbox user flows:

1. Add the new test case to `TEST_USERS` in `plaid_integration_test.py`
2. Include appropriate `expected_success` value
3. Update this README with the new test coverage
4. Test locally before committing

## Security Notes

- Test credentials are sandbox-only and safe for testing
- No real financial data is used
- Environment variables should be set securely in CI/CD
- Test reports may contain sensitive information - handle appropriately 