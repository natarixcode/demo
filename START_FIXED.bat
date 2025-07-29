@echo off
echo 🌟 NATARIX International Platform - Starting Servers
echo.

REM Kill existing processes
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🚀 Starting Backend Server...
start "NATARIX Backend" cmd /c "cd /D %~dp0backend && node server.js && pause"

timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend...
start "NATARIX Frontend" cmd /c "cd /D %~dp0 && npm run dev && pause"

timeout /t 3 /nobreak >nul

echo.
echo ✅ NATARIX International Platform Started!
echo.
echo 📱 Frontend: http://localhost:5173/
echo 🔧 Backend: http://localhost:3001/
echo 🔔 Notifications: Professional system with glassmorphism UI
echo.
echo Opening application...
timeout /t 2 /nobreak >nul
start http://localhost:5173/

echo.
echo 🎉 Your international-grade platform is ready!
echo Press any key to continue...
pause >nul 