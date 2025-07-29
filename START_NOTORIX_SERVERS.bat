@echo off
echo 🚀 STARTING NOTORIX SERVERS
echo ============================

echo.
echo 📋 Step 1: Starting Backend Server...
echo ============================
start "Notorix Backend" cmd /k "cd backend && node start-server-stable.js"
timeout /t 3

echo.
echo 🎨 Step 2: Starting Frontend Server...  
echo ============================
start "Notorix Frontend" cmd /k "npm run dev"
timeout /t 2

echo.
echo ✅ SERVERS STARTED SUCCESSFULLY!
echo ============================
echo 🔗 Backend API: http://localhost:3001
echo 🌐 Frontend App: http://localhost:5173
echo 🧭 Community Nexus: http://localhost:5173/nexus
echo.
echo 📊 Test Endpoints:
echo   • Health Check: http://localhost:3001/api/health
echo   • Database Test: http://localhost:3001/api/test-db  
echo   • Posts API: http://localhost:3001/api/posts
echo   • Communities API: http://localhost:3001/api/communities
echo   • Community Nexus API: http://localhost:3001/api/nexus
echo.
echo 💡 Press any key to close this window...
pause > nul 