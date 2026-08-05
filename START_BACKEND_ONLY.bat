@echo off
setlocal enabledelayedexpansion
color 0A

echo.
echo ===============================================
echo   IPS CRM - BACKEND ONLY (Port 5000)
echo ===============================================
echo.

cd /d "D:\Developer Application\Social-Media-Automation\API"

REM Check .env
if not exist "..\Configs\.env" (
    echo ERROR: Configs\.env not found!
    echo Please configure Configs\.env first
    pause
    exit /b 1
)

REM Kill port 5000
echo Cleaning port 5000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5000') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting Backend Server...
echo http://localhost:5000/api/health
echo.

npm run dev

pause
