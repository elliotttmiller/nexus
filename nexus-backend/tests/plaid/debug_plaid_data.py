#!/usr/bin/env python3
"""
Debug Plaid Data
================

This script fetches and displays the raw Plaid data to understand
why credit cards aren't being detected properly.
"""

import requests
import json

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def login_user():
    """Login with existing user credentials"""
    print("🔐 Logging in...")
    
    login_data = {
        "email": "elliotttmiller@hotmail.com",
        "password": "elliott"
    }
    
    try:
        r = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        
        if r.status_code == 200:
            data = r.json()
            token = data.get("token")
            user_id = data.get("userId", 1)
            print("✅ Login successful")
            return token, user_id
        else:
            print(f"❌ Login failed: {r.status_code}")
            return None, None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None, None

def debug_plaid_data(token, user_id):
    """Debug the raw Plaid data to understand account types"""
    print("🔍 Debugging Plaid data...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Retrieved {len(accounts)} accounts")
            
            print("\n📊 RAW ACCOUNT DATA:")
            print("=" * 60)
            for i, acc in enumerate(accounts):
                print(f"\nAccount {i+1}:")
                print(f"  ID: {acc.get('id')}")
                print(f"  Name: {acc.get('name')}")
                print(f"  Type: {acc.get('type')}")
                print(f"  Subtype: {acc.get('subtype')}")
                print(f"  Balance: ${acc.get('balance', 0):,.2f}")
                print(f"  Institution: {acc.get('institution')}")
                print(f"  APR: {acc.get('apr')}")
                print(f"  Credit Limit: ${acc.get('creditLimit', 0):,.2f}")
                print(f"  Minimum Payment: ${acc.get('minimumPayment', 0):,.2f}")
                
                # Check if this should be a credit card
                name_lower = acc.get('name', '').lower()
                is_credit_by_name = 'credit' in name_lower or 'card' in name_lower
                is_credit_by_type = acc.get('type') == 'credit'
                has_apr = acc.get('apr') is not None
                has_credit_limit = acc.get('creditLimit') is not None
                
                print(f"  Credit Card Detection:")
                print(f"    By name: {is_credit_by_name}")
                print(f"    By type: {is_credit_by_type}")
                print(f"    Has APR: {has_apr}")
                print(f"    Has credit limit: {has_credit_limit}")
                
                if is_credit_by_name or is_credit_by_type or has_apr or has_credit_limit:
                    print(f"    ⚠️ This should be detected as a credit card!")
            
            # Count by type
            type_counts = {}
            for acc in accounts:
                acc_type = acc.get('type', 'unknown')
                type_counts[acc_type] = type_counts.get(acc_type, 0) + 1
            
            print(f"\n📊 ACCOUNT TYPE SUMMARY:")
            print("=" * 60)
            for acc_type, count in type_counts.items():
                print(f"  {acc_type}: {count} accounts")
            
            # Check for potential credit cards
            potential_credit_cards = []
            for acc in accounts:
                name_lower = acc.get('name', '').lower()
                if ('credit' in name_lower or 'card' in name_lower or 
                    acc.get('apr') is not None or 
                    acc.get('creditLimit') is not None):
                    potential_credit_cards.append(acc)
            
            print(f"\n💳 POTENTIAL CREDIT CARDS:")
            print("=" * 60)
            if potential_credit_cards:
                for i, acc in enumerate(potential_credit_cards):
                    print(f"  {i+1}. {acc.get('name')} - Type: {acc.get('type')}")
            else:
                print("  No potential credit cards found")
            
            return accounts
        else:
            print(f"❌ Failed to fetch accounts: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return []
    except Exception as e:
        print(f"❌ Debug error: {e}")
        return []

def main():
    print("🚀 Debugging Plaid Data")
    print("=" * 60)
    
    # Login
    token, user_id = login_user()
    if not token:
        print("❌ Login failed - stopping")
        return
    
    print(f"👤 Using User ID: {user_id}")
    print("=" * 60)
    
    # Debug Plaid data
    accounts = debug_plaid_data(token, user_id)
    
    print("\n🎯 ANALYSIS:")
    print("=" * 60)
    if accounts:
        print("✅ Accounts were successfully fetched from Plaid")
        print("🔍 The issue might be in the credit card detection logic")
        print("💡 We may need to adjust the detection criteria")
    else:
        print("❌ No accounts found or error occurred")

if __name__ == "__main__":
    main() 