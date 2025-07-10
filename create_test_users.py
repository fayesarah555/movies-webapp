#!/usr/bin/env python3
"""
Script pour créer un utilisateur administrateur
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def create_admin_user():
    """Créer un utilisateur administrateur"""
    admin_data = {
        "username": "admin",
        "password": "admin123",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=admin_data)
        
        if response.status_code == 200:
            print("✅ Utilisateur admin créé avec succès!")
            print(f"Username: {admin_data['username']}")
            print(f"Password: {admin_data['password']}")
            print(f"Role: {admin_data['role']}")
        else:
            print(f"❌ Erreur lors de la création: {response.status_code}")
            print(f"Message: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur. Assurez-vous que l'API est démarrée.")
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")

def create_regular_user():
    """Créer un utilisateur normal"""
    user_data = {
        "username": "user",
        "password": "user123",
        "role": "user"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=user_data)
        
        if response.status_code == 200:
            print("✅ Utilisateur normal créé avec succès!")
            print(f"Username: {user_data['username']}")
            print(f"Password: {user_data['password']}")
            print(f"Role: {user_data['role']}")
        else:
            print(f"❌ Erreur lors de la création: {response.status_code}")
            print(f"Message: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur. Assurez-vous que l'API est démarrée.")
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")

if __name__ == "__main__":
    print("🔧 Création des utilisateurs de test...")
    print()
    
    create_admin_user()
    print()
    create_regular_user()
    print()
    
    print("🎯 Vous pouvez maintenant tester l'authentification avec:")
    print("Admin - Username: admin, Password: admin123")
    print("User - Username: user, Password: user123")
