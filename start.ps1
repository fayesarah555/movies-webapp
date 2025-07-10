# Script PowerShell pour démarrer l'application Movies Database

Write-Host "🚀 Démarrage de l'application Movies Database" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Vérifier si Neo4j est en cours d'exécution
Write-Host "📍 Vérification de Neo4j..." -ForegroundColor Yellow
$neo4jRunning = Test-NetConnection -ComputerName localhost -Port 7687 -InformationLevel Quiet
if (-not $neo4jRunning) {
    Write-Host "❌ Neo4j n'est pas en cours d'exécution sur le port 7687" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Neo4j avant de continuer" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Neo4j est en cours d'exécution" -ForegroundColor Green

# Démarrer l'API FastAPI en arrière-plan
Write-Host "🔧 Démarrage de l'API FastAPI..." -ForegroundColor Yellow
Set-Location -Path "simple-fastapi"
$apiProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -PassThru

# Attendre que l'API soit prête
Write-Host "⏳ Attente du démarrage de l'API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Vérifier si l'API est accessible
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API FastAPI démarrée avec succès" -ForegroundColor Green
    } else {
        throw "API non accessible"
    }
} catch {
    Write-Host "❌ Erreur lors du démarrage de l'API" -ForegroundColor Red
    Stop-Process -Id $apiProcess.Id -Force
    exit 1
}

# Démarrer le front-end Vite
Write-Host "🎨 Démarrage du front-end..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot/front"

$frontProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru

Write-Host "✅ Application démarrée avec succès!" -ForegroundColor Green
Write-Host "📍 API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 Front-end: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter les services" -ForegroundColor Yellow

# Fonction pour arrêter les services
function Stop-Services {
    Write-Host ""
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    
    if ($apiProcess -and !$apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
    }
    
    if ($frontProcess -and !$frontProcess.HasExited) {
        Stop-Process -Id $frontProcess.Id -Force
    }
    
    # Arrêter également les processus enfants
    Get-Process | Where-Object { $_.ProcessName -eq "node" -or $_.ProcessName -eq "python" } | Stop-Process -Force
    
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
    exit 0
}

# Écouter le signal d'interruption
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Vérifier si les processus sont toujours en cours d'exécution
        if ($apiProcess.HasExited) {
            Write-Host "❌ L'API s'est arrêtée de manière inattendue" -ForegroundColor Red
            break
        }
        
        if ($frontProcess.HasExited) {
            Write-Host "❌ Le front-end s'est arrêté de manière inattendue" -ForegroundColor Red
            break
        }
    }
} catch {
    Stop-Services
} finally {
    Stop-Services
}
