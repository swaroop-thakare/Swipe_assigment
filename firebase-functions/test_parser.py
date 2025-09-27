#!/usr/bin/env python3
"""
Test script for the Professional Resume Parser
"""

import requests
import json
import base64

def test_health():
    """Test the health endpoint."""
    try:
        response = requests.get('http://localhost:5006/health')
        if response.status_code == 200:
            data = response.json()
            print("✅ Health Check Passed")
            print(f"   Service: {data.get('service')}")
            print(f"   PDF Support: {data.get('pdf_available')}")
            print(f"   DOCX Support: {data.get('docx_available')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

def test_parse_dummy():
    """Test parsing with dummy data."""
    try:
        # Create dummy base64 content
        dummy_content = base64.b64encode(b"dummy pdf content").decode('utf-8')
        
        payload = {
            "file": dummy_content,
            "type": "application/pdf",
            "filename": "test.pdf"
        }
        
        response = requests.post(
            'http://localhost:5006/parse-resume',
            headers={'Content-Type': 'application/json'},
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Parse Test Completed")
            print(f"   Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Parse Test Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Parse Test Error: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing Professional Resume Parser...")
    print("=" * 50)
    
    # Test health endpoint
    health_ok = test_health()
    print()
    
    # Test parse endpoint
    parse_ok = test_parse_dummy()
    print()
    
    # Summary
    print("=" * 50)
    if health_ok and parse_ok:
        print("🎉 All tests passed! Parser is working correctly.")
    else:
        print("❌ Some tests failed. Check the parser logs.")
    
    print("\n📋 Available endpoints:")
    print("   Health: http://localhost:5006/health")
    print("   Parse:  http://localhost:5006/parse-resume")

if __name__ == "__main__":
    main()
