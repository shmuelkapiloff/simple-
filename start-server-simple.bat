@echo off
echo 🚀 Starting TechBasket Server...
echo ================================

cd /d "%~dp0server"
echo 📁 Current directory: %CD%

echo 📦 Installing dependencies...
call npm install

echo 🔧 Starting server with ts-node...
call npx ts-node src/server.ts

pause