@echo off
color 0C

echo.
echo ===============================================
echo   IPS CRM - FULL RESET
echo ===============================================
echo.
echo This will:
echo 1. Kill all node processes
echo 2. Delete node_modules
echo 3. Delete package-lock.json
echo 4. Reinstall everything
echo.

pause

cd /d "D:\Developer Application\Social-Media-Automation"

REM Kill all node processes
echo Killing node processes...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM npm.exe /F >nul 2>&1

REM Clean backend
echo Cleaning backend...
cd API
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
echo Installing backend dependencies...
call npm install
cd ..

REM Clean frontend
echo Cleaning frontend...
cd Web
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist ".next" rmdir /s /q .next
echo Installing frontend dependencies...
call npm install
cd ..

echo.
echo ✓ RESET COMPLETE
echo.
echo Now run: START_ALL.bat
echo.
pause
