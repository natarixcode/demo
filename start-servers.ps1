# PowerShell script to start Notorix Database Testing System
# start-servers.ps1

Write-Host "🚀 Starting Notorix Database Testing System..." -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running on port 5432
if (Test-Port 5432) {
    Write-Host "✅ PostgreSQL detected on port 5432" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL not detected on port 5432" -ForegroundColor Yellow
    Write-Host "   Make sure PostgreSQL is running with:" -ForegroundColor Yellow
    Write-Host "   - Database: notorix" -ForegroundColor Yellow
    Write-Host "   - User: postgres" -ForegroundColor Yellow
    Write-Host "   - Password: admin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Install frontend dependencies
if (Test-Path "package.json") {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
}

# Install backend dependencies
if (Test-Path "backend/package.json") {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Set-Location ..
} else {
    Write-Host "❌ Backend package.json not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🖥️  Starting servers..." -ForegroundColor Green
Write-Host ""

# Start backend server in a new PowerShell window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Green; node server.js"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server in a new PowerShell window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '⚡ Frontend Server Starting...' -ForegroundColor Blue; npm run dev"

# Wait for servers to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 Servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "🧪 Test DB:  http://localhost:5000/api/test-db" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • The frontend may take a moment to compile" -ForegroundColor Gray
Write-Host "   • Check the new PowerShell windows for server logs" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in each window to stop servers" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Happy testing!" -ForegroundColor Magenta

# Keep this window open
Read-Host "Press Enter to close this window" 