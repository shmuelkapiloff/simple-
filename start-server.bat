@echo off
echo 🚀 Starting TechBasket Server...
cd /d "%~dp0"
cd server
echo Current directory: %cd%
npm run dev
pause