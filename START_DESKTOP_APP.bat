@echo off
cd /d "%~dp0Desktop"
if not exist node_modules (
  echo Installing desktop app dependencies, first run only...
  call npm install
)
call npm start
