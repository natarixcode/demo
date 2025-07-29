@echo off
echo 🚀 Starting Natarix Servers...
echo.

REM Kill any existing Node processes
taskkill /f /im node.exe >nul 2>&1

REM Start Backend Server
echo 📡 Starting Backend Server...
start "Natarix Backend" cmd /c "cd /D E:\Notorix_build-feature-notorix_akram\backend && node server.js & pause"

REM Wait 3 seconds
timeout /t 3 /nobreak >nul

REM Start Frontend Server  
echo 🎨 Starting Frontend Server...
start "Natarix Frontend" cmd /c "cd /D E:\Notorix_build-feature-notorix_akram && npm run dev & pause"

echo.
echo ✅ Both servers are starting in separate windows!
echo.
echo 📱 Frontend: http://localhost:5173/
echo 🔧 Backend:  http://localhost:3001/
echo 🔔 Notifications: http://localhost:5173/settings/notifications
echo.
echo 🎉 Your notification system is ready!
echo.
pause 