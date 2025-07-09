#!/usr/bin/env python3
"""
Tests simples pour l'API FastAPI avec Neo4j
"""

import requests
import time
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8001"

def test_endpoint(endpoint, expected_status=200):
    """Tester un endpoint et afficher le résultat"""
    try:
        print(f"🧪 Test: {endpoint}")
        response = requests.get(f"{BASE_URL}{endpoint}")
        
        if response.status_code == expected_status:
            print(f"✅ Status: {response.status_code}")
            
            # Afficher le contenu JSON si possible
            try:
                data = response.json()
                print(f"📝 Response: {data}")
                return True, data
            except:
                print(f"📝 Response: {response.text[:100]}...")
                return True, response.text
        else:
            print(f"❌ Status: {response.status_code} (expected {expected_status})")
            return False, None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Server not running at {BASE_URL}")
        return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

def run_all_tests():
    """Exécuter tous les tests"""
    print("🚀 Démarrage des tests API")
    print("=" * 50)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Endpoint racine
    tests_total += 1
    success, data = test_endpoint("/")
    if success and data.get("message") == "Hello World!":
        tests_passed += 1
        print("✅ Test racine: PASS")
    else:
        print("❌ Test racine: FAIL")
    print()
    
    # Test 2: Health check
    tests_total += 1
    success, data = test_endpoint("/health")
    if success and data.get("status") == "OK":
        tests_passed += 1
        print("✅ Test health: PASS")
    else:
        print("❌ Test health: FAIL")
    print()
    
    # Test 3: Items endpoint
    tests_total += 1
    success, data = test_endpoint("/items/42?q=test")
    if success and data.get("item_id") == 42 and data.get("q") == "test":
        tests_passed += 1
        print("✅ Test items: PASS")
    else:
        print("❌ Test items: FAIL")
    print()
    
    # Test 4: Neo4j test (le plus important)
    tests_total += 1
    success, data = test_endpoint("/neo4j/test")
    if success:
        if data.get("status") == "success":
            tests_passed += 1
            print("✅ Test Neo4j: PASS - Connexion réussie!")
            print(f"   Message: {data.get('message')}")
            print(f"   Time: {data.get('time')}")
            print(f"   URI: {data.get('uri')}")
        elif data.get("status") == "error":
            print("⚠️  Test Neo4j: PARTIAL - Endpoint répond mais erreur Neo4j")
            print(f"   Error: {data.get('message')}")
        else:
            print("❌ Test Neo4j: FAIL - Réponse inattendue")
    else:
        print("❌ Test Neo4j: FAIL - Endpoint ne répond pas")
    print()
    
    # Test 5: Documentation
    tests_total += 1
    success, data = test_endpoint("/docs")
    if success:
        tests_passed += 1
        print("✅ Test docs: PASS")
    else:
        print("❌ Test docs: FAIL")
    print()
    
    # Résumé
    print("=" * 50)
    print(f"📊 Résultats: {tests_passed}/{tests_total} tests réussis")
    
    if tests_passed == tests_total:
        print("🎉 Tous les tests sont réussis! L'API fonctionne parfaitement.")
    elif tests_passed >= tests_total - 1:
        print("✅ La plupart des tests sont réussis. L'API fonctionne bien.")
    else:
        print("⚠️  Plusieurs tests ont échoué. Vérifiez la configuration.")
    
    return tests_passed, tests_total

def check_server():
    """Vérifier si le serveur est en cours d'exécution"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("🔍 Vérification du serveur...")
    
    if not check_server():
        print(f"❌ Serveur non accessible sur {BASE_URL}")
        print("💡 Assurez-vous que le serveur est démarré avec:")
        print("   uvicorn main:app --host 127.0.0.1 --port 8001 --reload")
        sys.exit(1)
    
    print(f"✅ Serveur accessible sur {BASE_URL}")
    print()
    
    # Exécuter les tests
    passed, total = run_all_tests()
    
    # Code de sortie
    if passed == total:
        sys.exit(0)
    else:
        sys.exit(1)
