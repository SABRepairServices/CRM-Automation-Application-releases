@echo off
setlocal enabledelayedexpansion
color 0A

echo.
echo ===============================================
echo   IPS CRM - COMPLETE STARTUP SCRIPT
echo ===============================================
echo.

REM Set working directory
cd /d "D:\Developer Application\Social-Media-Automation"

REM Check if .env files exist
echo Checking configuration files...
if not exist "Configs\.env" (
    echo ERROR: Configs\.env not found!
    echo Please copy Configs\.env.example to Configs\.env and configure it
    pause
    exit /b 1
)

if not exist "Web\.env.local" (
    echo ERROR: Web\.env.local not found!
    echo Please copy Web\.env.example to Web\.env.local
    pause
    exit /b 1
)

echo ✓ Configuration files found

REM Kill port 5000 if in use
echo.
echo Cleaning up port 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5000') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)
echo ✓ Port 5000 cleaned

REM Kill port 3000 if in use
echo Cleaning up port 3000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000') do (
    echo Killing process %%a...
    taskkill /PID %%a /F >nul 2>&1
)
echo ✓ Port 3000 cleaned

REM Install dependencies if needed
echo.
echo Checking backend dependencies...
cd API
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install
)
cd ..

echo Checking frontend dependencies...
cd Web
if not exist "node_modules" (
    echo Installing frontend packages...
    call npm install
)
cd ..

echo ✓ All dependencies ready

REM Start services
echo.
echo ===============================================
echo Starting services...
echo ===============================================
echo.

echo [1/2] Starting Backend (port 5000)...
timeout /t 1 /nobreak >nul
start "IPS-Backend" cmd /k "cd API && npm run dev"

echo [2/2] Starting Frontend (port 3000)...
timeout /t 3 /nobreak
start "IPS-Frontend" cmd /k "cd Web && npm run dev"

REM Open browser
echo.
echo Waiting for servers to start...
timeout /t 5 /nobreak
echo Opening browser...
start http://localhost:3000

echo.
echo ===============================================
echo ✅ STARTUP COMPLETE
echo ===============================================
echo.
echo Backend:  http://localhost:5000/api/health
echo Frontend: http://localhost:3000
echo.
echo Close this window when done (other windows will stay open)
echo.
pause
