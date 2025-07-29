@echo off
echo 🚀 STARTING NOTORIX SERVERS (ROBUST MODE)
echo =============================================

echo.
echo 🔧 Killing any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 📋 Step 1: Starting Backend Server (Robust)...
echo =============================================
start "Notorix Backend (Robust)" cmd /k "cd /d %~dp0backend && echo Starting backend server... && node start-server-stable.js || (echo Backend crashed! Press any key to restart... && pause && node start-server-stable.js)"

echo.
echo ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Step 2: Starting Frontend Server (Robust)...
echo =============================================
start "Notorix Frontend (Robust)" cmd /k "cd /d %~dp0 && echo Starting frontend server... && npm run dev || (echo Frontend crashed! Press any key to restart... && pause && npm run dev)"

echo.
echo ⏳ Waiting 3 seconds for frontend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ✅ SERVERS STARTED SUCCESSFULLY (ROBUST MODE)!
echo =============================================
echo 🔗 Backend API: http://localhost:3001
echo 🌐 Frontend App: http://localhost:5173
echo 🧭 Community Nexus: http://localhost:5173/nexus
echo.
echo 📊 Test Endpoints:
echo   • Health Check: http://localhost:3001/api/health
echo   • Posts API: http://localhost:3001/api/posts
echo   • Login API: http://localhost:3001/api/auth/login
echo   • Community Nexus: http://localhost:3001/api/nexus
echo.
echo 🔄 If a server crashes, it will show restart instructions
echo 💡 Close this window when you're done testing
echo.
pause 