#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ProbabilityOSAPITester:
    def __init__(self, base_url="https://cda40dc9-9ffa-4a9a-80ea-2586339924d2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status=200, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=params, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    json_data = response.json()
                    if isinstance(json_data, list):
                        print(f"   Response: Array with {len(json_data)} items")
                    elif isinstance(json_data, dict):
                        print(f"   Response: Object with keys: {list(json_data.keys())}")
                    else:
                        print(f"   Response: {type(json_data)}")
                except:
                    print(f"   Response: Non-JSON content")
                    
                self.test_results.append({
                    "test": name,
                    "status": "PASS",
                    "response_code": response.status_code,
                    "endpoint": endpoint
                })
                return True, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.test_results.append({
                    "test": name,
                    "status": "FAIL",
                    "response_code": response.status_code,
                    "endpoint": endpoint,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_polymarket_markets(self):
        """Test Polymarket markets endpoint"""
        success, response = self.run_test(
            "Polymarket Markets",
            "GET",
            "api/polymarket/markets",
            200,
            params={"active": "true", "limit": "10", "order": "volume24hr", "ascending": "false"}
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} markets")
            if len(response) > 0:
                market = response[0]
                print(f"   Sample market: {market.get('question', 'Unknown')[:50]}...")
        
        return success, response

    def test_kalshi_markets(self):
        """Test Kalshi markets endpoint"""
        success, response = self.run_test(
            "Kalshi Markets",
            "GET",
            "api/kalshi/markets",
            200,
            params={"status": "open", "limit": "10"}
        )
        
        if success:
            if isinstance(response, dict) and 'markets' in response:
                markets = response['markets']
                print(f"   Found {len(markets)} markets")
                if len(markets) > 0:
                    market = markets[0]
                    print(f"   Sample market: {market.get('title', 'Unknown')[:50]}...")
            elif isinstance(response, list):
                print(f"   Found {len(response)} markets")
        
        return success, response

    def test_polymarket_price_history(self, condition_id=None):
        """Test Polymarket price history endpoint"""
        # Use a sample condition ID if none provided
        if not condition_id:
            condition_id = "0x1234567890abcdef"  # Sample ID for testing
        
        success, response = self.run_test(
            "Polymarket Price History",
            "GET",
            "api/polymarket/prices-history",
            200,
            params={"market": condition_id, "interval": "1h", "fidelity": "60"}
        )
        
        if success:
            if isinstance(response, dict):
                if 'history' in response:
                    history = response['history']
                    print(f"   Found {len(history)} price points")
                elif 'error' in response:
                    print(f"   API returned error: {response['error']}")
            elif isinstance(response, list):
                print(f"   Found {len(response)} price points")
        
        return success

def main():
    print("🚀 Starting ProbabilityOS Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = ProbabilityOSAPITester()
    
    # Run tests
    print("\n📋 Running API Tests...")
    
    # Test health endpoint
    tester.test_health_endpoint()
    
    # Test Polymarket markets
    poly_success, poly_data = tester.test_polymarket_markets()
    
    # Test Kalshi markets  
    kalshi_success, kalshi_data = tester.test_kalshi_markets()
    
    # Test price history with a real condition ID if we got one from Polymarket
    condition_id = None
    if poly_success and isinstance(poly_data, list) and len(poly_data) > 0:
        condition_id = poly_data[0].get('conditionId')
    
    tester.test_polymarket_price_history(condition_id)
    
    # Print results
    print(f"\n📊 Test Results Summary")
    print("=" * 30)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        print("\nFailed tests:")
        for result in tester.test_results:
            if result['status'] != 'PASS':
                print(f"  - {result['test']}: {result['status']}")
                if 'error' in result:
                    print(f"    Error: {result['error']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())