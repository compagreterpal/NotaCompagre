#!/usr/bin/env python3
"""
Test script untuk memverifikasi API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_api():
    print("Testing Nota Perusahaan Web API...")
    print("=" * 50)
    
    # Test 1: Get all receipts
    print("\n1. Testing GET /api/receipts")
    try:
        response = requests.get(f"{BASE_URL}/api/receipts")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Receipts count: {len(data.get('receipts', []))}")
            if data.get('receipts'):
                print(f"Sample receipt: {data['receipts'][0]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Get receipts by company
    print("\n2. Testing GET /api/receipts?company=CH")
    try:
        response = requests.get(f"{BASE_URL}/api/receipts?company=CH")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"CH receipts count: {len(data.get('receipts', []))}")
            if data.get('receipts'):
                print(f"Sample CH receipt: {data['receipts'][0]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Get receipts by company CR
    print("\n3. Testing GET /api/receipts?company=CR")
    try:
        response = requests.get(f"{BASE_URL}/api/receipts?company=CR")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"CR receipts count: {len(data.get('receipts', []))}")
            if data.get('receipts'):
                print(f"Sample CR receipt: {data['receipts'][0]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_api()
