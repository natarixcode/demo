@echo off
echo 🚀 Starting Natarix Servers...
echo.

echo 📡 Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd backend && node server.js"

echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo 🎨 Starting Frontend Server (Port 5174)...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo 📱 Frontend: http://localhost:5174/
echo 🔧 Backend:  http://localhost:3001/
echo.
echo Press any key to close this window...
pause > nul 