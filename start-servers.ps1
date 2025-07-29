Write-Host "🚀 Starting Natarix Servers..." -ForegroundColor Green
Write-Host ""

Write-Host "📡 Starting Backend Server (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; node server.js"

Write-Host "⏳ Waiting 3 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "🎨 Starting Frontend Server (Port 5174)..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5174/" -ForegroundColor Blue
Write-Host "🔧 Backend:  http://localhost:3001/" -ForegroundColor Blue
Write-Host ""
Write-Host "🔔 Your notification system is ready!" -ForegroundColor Magenta
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 