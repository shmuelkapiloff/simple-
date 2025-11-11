@echo off
echo 🔍 TechBasket Health Check - Starting...
echo.

REM בדיקה שNode.js מותקן
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM הרצת בדיקת הבריאות
echo Running health check...
echo.
node "%~dp0health-check.js"

echo.
echo Press any key to exit...
pause >nul