#!/usr/bin/env pwsh
# =========================================
# SMGO Application Startup Script (PowerShell)
# =========================================
# This script starts all required services for the SMGO application
# Prerequisites: Java 17, Maven, Node.js, MongoDB

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "SMGO Application Startup Script (PowerShell)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check MongoDB
Write-Host "[1/3] Checking MongoDB on port 27017..." -ForegroundColor Yellow
$mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -ErrorAction SilentlyContinue
if ($mongoRunning.TcpTestSucceeded) {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠ WARNING: MongoDB may not be running on port 27017" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running (mongod or docker-compose up -d)" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway..."
}
Write-Host ""

# Build Backend
Write-Host "[2/3] Checking backend build..." -ForegroundColor Yellow
$jarPath = Join-Path $scriptRoot "backend/target/content-management-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jarPath)) {
    Write-Host "Building backend..." -ForegroundColor Cyan
    Push-Location (Join-Path $scriptRoot "backend")
    & mvn clean package -DskipTests -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Backend build failed" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit..."
        exit 1
    }
    Pop-Location
    Write-Host "✓ Backend built successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Backend JAR exists" -ForegroundColor Green
}
Write-Host ""

# Check Frontend
Write-Host "[3/3] Checking frontend dependencies..." -ForegroundColor Yellow
Push-Location (Join-Path $scriptRoot "frontend")
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    & npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit..."
        exit 1
    }
}
Write-Host "✓ Frontend dependencies present" -ForegroundColor Green
Pop-Location
Write-Host ""

# Start services
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Starting Services..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend on port 8090..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $scriptRoot "backend") -ArgumentList "-NoExit", "-Command", "java -jar target/content-management-0.0.1-SNAPSHOT.jar"
Start-Sleep -Seconds 3

Write-Host "Starting Frontend on port 4200..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory (Join-Path $scriptRoot "frontend") -ArgumentList "-NoExit", "-Command", "npm start"
Start-Sleep -Seconds 2

Write-Host "Populating test data..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $scriptRoot -ArgumentList "-NoExit", "-Command", "node populate-db.js"
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Services are starting..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Green
Write-Host "  • Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host "  • Backend API: http://localhost:8090" -ForegroundColor Cyan
Write-Host "  • API Docs: http://localhost:8090/swagger-ui.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait 10-15 seconds for all services to fully start" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit this window"
