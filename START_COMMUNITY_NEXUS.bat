@echo off
cls
echo.
echo ========================================================
echo   🧭 NOTORIX COMMUNITY NEXUS - UNIFIED LAUNCH
echo ========================================================
echo.
echo   Welcome to the ultimate community exploration hub!
echo   • Discovery, Browse, Search - All in one place
echo   • Advanced filtering and smart recommendations
echo   • iOS 17-inspired design with glassmorphism
echo   • Deep database integration with analytics
echo.
echo ========================================================

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

REM Run database migration for Community Discovery (if needed)
echo.
echo 🗄️ Ensuring database is up to date...
node setup-community-discovery.js >nul 2>&1

echo.
echo 🎯 Starting Community Nexus servers...
echo.

REM Start backend server in a new window
echo 🚀 Starting unified backend server on port 3001...
start "Notorix Community Nexus Backend" cmd /k "echo 🚀 COMMUNITY NEXUS BACKEND (Port 3001) && echo. && echo APIs available: && echo   - /api/nexus (Unified community exploration) && echo   - /api/communities (Legacy support) && echo   - /api/nexus/recommendations (Smart recommendations) && echo. && node server.js"

REM Wait a moment for backend to start
timeout /t 3 >nul

REM Navigate back to root and start frontend
cd ..

REM Start frontend server in a new window
echo 🎨 Starting Community Nexus frontend on port 5173...
start "Notorix Community Nexus Frontend" cmd /k "echo 🎨 COMMUNITY NEXUS FRONTEND (Port 5173) && echo. && echo Features available: && echo   - Discovery Mode: Smart sections with trending, nearby, popular && echo   - Grid Mode: Traditional card layout with advanced filters && echo   - Search: Advanced relevance-based search && echo   - Analytics: Real-time community statistics && echo. && npm run dev"

REM Show status
echo.
echo ✅ Community Nexus is launching...
echo.
echo 📊 UNIFIED FEATURES:
echo   🔥 Trending Communities (Smart algorithm)
echo   📍 Nearby Communities (Geolocation-based)
echo   👑 Popular Communities (Engagement metrics)
echo   ✨ Latest Communities (Quality indicators)
echo   🔍 Advanced Search (Relevance scoring)
echo   🎯 Smart Recommendations (AI-powered)
echo   📈 Real-time Analytics (Deep insights)
echo.
echo 🌐 ACCESS POINTS:
echo   📍 Backend API:      http://localhost:3001
echo   🧭 Community Nexus:  http://localhost:5173/nexus
echo   🔗 Legacy Discovery: http://localhost:5173/discovery
echo   🏘️ Legacy Browse:    http://localhost:5173/communities
echo.
echo ========================================================
echo   🎉 COMMUNITY NEXUS IS READY FOR EXPLORATION!
echo ========================================================
echo.
echo Press any key to close this window...
pause >nul 