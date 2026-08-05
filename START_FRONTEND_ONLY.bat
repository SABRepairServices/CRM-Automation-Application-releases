@echo off
setlocal enabledelayedexpansion
color 0A

echo.
echo ===============================================
echo   IPS CRM - FRONTEND ONLY (Port 3000)
echo ===============================================
echo.

cd /d "D:\Developer Application\Social-Media-Automation\Web"

REM Check .env
if not exist ".env.local" (
    echo ERROR: Web\.env.local not found!
    echo Please configure Web\.env.local first
    pause
    exit /b 1
)

REM Kill port 3000
echo Cleaning port 3000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting Frontend Server...
echo http://localhost:3000
echo.

npm run dev

pause
