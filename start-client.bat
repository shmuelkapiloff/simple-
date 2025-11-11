@echo off
echo 🌐 Starting TechBasket Client...
cd /d "%~dp0"
cd client
echo Current directory: %cd%
npm run dev
pause