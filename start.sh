#!/bin/bash

# Script pour démarrer le front-end et l'API

echo "🚀 Démarrage de l'application Movies Database"
echo "============================================"

# Vérifier si Neo4j est en cours d'exécution
echo "📍 Vérification de Neo4j..."
if ! nc -z localhost 7687; then
    echo "❌ Neo4j n'est pas en cours d'exécution sur le port 7687"
    echo "   Veuillez démarrer Neo4j avant de continuer"
    exit 1
fi

echo "✅ Neo4j est en cours d'exécution"

# Démarrer l'API FastAPI en arrière-plan
echo "🔧 Démarrage de l'API FastAPI..."
cd simple-fastapi
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
API_PID=$!

# Attendre que l'API soit prête
echo "⏳ Attente du démarrage de l'API..."
sleep 5

# Vérifier si l'API est accessible
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API FastAPI démarrée avec succès"
else
    echo "❌ Erreur lors du démarrage de l'API"
    kill $API_PID
    exit 1
fi

# Démarrer le front-end Vite
echo "🎨 Démarrage du front-end..."
cd ../front
npm run dev &
FRONT_PID=$!

echo "✅ Application démarrée avec succès!"
echo "📍 API: http://localhost:8000"
echo "📍 Front-end: http://localhost:5173"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les services"

# Fonction pour arrêter les services
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $API_PID
    kill $FRONT_PID
    echo "✅ Services arrêtés"
    exit 0
}

# Écouter le signal d'interruption
trap cleanup SIGINT

# Attendre que les processus se terminent
wait
