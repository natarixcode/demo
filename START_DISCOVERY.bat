@echo off
cls
echo.
echo ================================================
echo   🚀 NOTORIX COMMUNITY DISCOVERY STARTUP
echo ================================================
echo.

REM Kill any existing Node.js processes
echo 🧹 Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM Navigate to backend directory
cd backend

REM Check if backend files exist
if not exist "server.js" (
    echo ❌ Backend server.js not found!
    echo Please ensure you're in the correct directory.
    pause
    exit /b 1
)

REM Run database migration for Community Discovery
echo.
echo 🗄️ Running Community Discovery database migration...
node setup-community-discovery.js
if %errorlevel% neq 0 (
    echo ❌ Database migration failed!
    pause
    exit /b 1
)

echo.
echo 🎯 Migration completed! Starting servers...
echo.

REM Start backend server in a new window
echo 🚀 Starting backend server on port 3001...
start "Notorix Backend Server" cmd /k "echo 🚀 BACKEND SERVER (Port 3001) && node server.js"

REM Wait a moment for backend to start
timeout /t 3 >nul

REM Navigate back to root and start frontend
cd ..

REM Start frontend server in a new window
echo 🎨 Starting frontend server on port 5173...
start "Notorix Frontend Server" cmd /k "echo 🎨 FRONTEND SERVER (Port 5173) && npm run dev"

REM Show status
echo.
echo ✅ Both servers are starting...
echo.
echo 📍 Backend API:  http://localhost:3001
echo 🌐 Frontend:     http://localhost:5173
echo 🔍 Discovery:    http://localhost:5173/discovery
echo.
echo ================================================
echo   🎉 NOTORIX COMMUNITY DISCOVERY IS READY!
echo ================================================
echo.
echo Press any key to close this window...
pause >nul 