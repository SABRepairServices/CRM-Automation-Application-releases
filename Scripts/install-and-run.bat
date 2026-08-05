@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM Social Media Automation - Complete Setup & Run Script
REM ============================================================

title Social Media Automation - Setup & Run

cd /d "%~dp0.."

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Social Media Automation Platform                    ║
echo ║   Complete Setup & Run Script                         ║
echo ║   Version 1.0.0                                       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM ============================================================
REM Check Prerequisites
REM ============================================================

echo [1/5] Checking prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found!
    echo    Download: https://nodejs.org/
    echo    Install Node.js 18+ and try again
    pause
    exit /b 1
)
echo ✅ Node.js installed

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found!
    pause
    exit /b 1
)
echo ✅ npm installed

echo.

REM ============================================================
REM Install Frontend Dependencies
REM ============================================================

echo [2/5] Installing Frontend dependencies...
cd Web
echo    Running: npm install
call npm install
if errorlevel 1 (
    echo ❌ Frontend install failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed
cd ..

echo.

REM ============================================================
REM Install Backend Dependencies
REM ============================================================

echo [3/5] Installing Backend dependencies...
cd API
echo    Running: npm install
call npm install
if errorlevel 1 (
    echo ❌ Backend install failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
cd ..

echo.

REM ============================================================
REM Verify Configuration
REM ============================================================

echo [4/5] Verifying configuration...
if exist "Configs\.env" (
    echo ✅ Configuration file found
    echo    Remember to add your API keys!
) else (
    echo ⚠️  .env file not found
    echo    Copyon .env.example to .env and add your API keys
)

echo.

REM ============================================================
REM Start Servers
REM ============================================================

echo [5/5] Starting development servers...
echo.

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Setup Complete! Starting Servers...                 ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo Starting Frontend (Terminal 1)...
echo   Access: http://localhost:3000
echo.

echo Starting Backend (Terminal 2)...
echo   Access: http://localhost:5000/api/health
echo.

REM Create batch files to run in separate windows
(
echo @echo off
echo cd /d "%cd%\Web"
echo npm run dev
) > "%temp%\run-frontend.bat"

(
echo @echo off
echo cd /d "%cd%\API"
echo npm run dev
) > "%temp%\run-backend.bat"

REM Start both servers in separate windows
start "Frontend Server" cmd /k "%temp%\run-frontend.bat"
start "Backend Server" cmd /k "%temp%\run-backend.bat"

echo.
echo ✅ Servers started in separate windows
echo.
echo 🎯 Next steps:
echo    1. Wait for both servers to start (30-60 seconds)
echo    2. Frontend will auto-open at http://localhost:3000
echo    3. Backend running at http://localhost:5000
echo    4. Close these windows when done
echo.
pause
