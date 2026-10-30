@echo off
title BR Millet Choice Server
color 0A
echo ===================================================
echo        BR Millet Choice - Local Server Launcher
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js 20 or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/2] Checking database tables and migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Database migration reported an issue.
    echo Please verify that PostgreSQL is running and credentials in .env are correct.
    echo.
)

echo [2/2] Starting server at http://localhost:3000 ...
echo Press Ctrl+C at any time to stop the server.
echo.
call npm start
pause
