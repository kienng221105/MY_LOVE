@echo off
title OurSpace Launcher 💕
color 0D

echo ===================================================
echo             OurSpace Project Launcher 💕
echo ===================================================
echo.
echo [1/3] Khoi dong NestJS Backend Server (Port 4000)...
start "OurSpace Backend (NestJS)" cmd /k "cd /d %~dp0server && npm run start:dev"

echo.
echo [2/3] Khoi dong Next.js Frontend App (Port 3000)...
start "OurSpace Frontend (Next.js)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo [3/3] Dang mo ung dung tren trinh duyet...
timeout /t 3 >nul
start http://localhost:3000

echo.
echo ===================================================
echo      OurSpace da duoc khoi chay thanh cong! ✨
echo      Backend API:  http://localhost:4000/api
echo      Swagger Docs: http://localhost:4000/api/docs
echo      Frontend App: http://localhost:3000
echo ===================================================
echo.
pause
