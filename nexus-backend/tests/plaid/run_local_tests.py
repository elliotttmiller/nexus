#!/usr/bin/env python3
"""
Local Plaid Test Runner
======================

Simple script to run Plaid sandbox tests locally during development.

Usage:
    python run_local_tests.py
"""

import os
import sys
import time
from plaid_integration_test import run_comprehensive_tests

def main():
    print("🚀 Running Plaid sandbox tests locally...")
    print("Make sure your backend is running on http://localhost:8080")
    print("=" * 60)
    
    # Set environment variables if not already set
    if not os.environ.get("PLAID_CLIENT_ID"):
        print("⚠️ PLAID_CLIENT_ID not set. Using default test values.")
    
    if not os.environ.get("PLAID_SECRET"):
        print("⚠️ PLAID_SECRET not set. Using default test values.")
    
    # Run tests
    start_time = time.time()
    success = run_comprehensive_tests()
    end_time = time.time()
    
    print(f"\n⏱️ Total time: {end_time - start_time:.2f} seconds")
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 