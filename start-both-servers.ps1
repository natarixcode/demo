#!/usr/bin/env pwsh
# Notorix - Start Both Servers Script
# This script starts both the backend and frontend servers

# Start both backend and frontend servers
Write-Host "🚀 Starting Notorix Development Servers..." -ForegroundColor Green

# Kill any existing Node processes
Write-Host "🔄 Stopping existing servers..." -ForegroundColor Yellow
try {
    $result = taskkill /F /IM node.exe 2>&1
    Write-Host "✅ Stopped existing Node processes" -ForegroundColor Green
}
catch {
    Write-Host "ℹ️ No existing Node processes to stop" -ForegroundColor Cyan
}

# Wait a moment for ports to be released
Start-Sleep -Seconds 2

# Start backend server
Write-Host "🔧 Starting backend server (port 5000)..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🎨 Starting frontend server (port 5173)..." -ForegroundColor Yellow
Set-Location ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 Both servers are starting up!" -ForegroundColor Green
Write-Host "📡 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend App: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Please wait a few seconds for both servers to fully start..." -ForegroundColor Yellow
Write-Host "🔍 Check the new terminal windows for server status" -ForegroundColor Magenta 