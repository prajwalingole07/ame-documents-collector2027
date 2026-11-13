@echo off
setlocal EnableDelayedExpansion
title ADMISSIONS MADE EASY, LATUR - Student Document Portal 2027
color 0B
cls

echo ======================================================================
echo    ADMISSIONS MADE EASY, LATUR - STUDENT DOCUMENT PORTAL 2027
echo    Starting Local Development Server for PC and Mobile
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js runtime environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js is installed.

echo.
echo [2/3] Checking dependencies (node_modules)...
if not exist "node_modules" (
    echo Installing required packages... This might take 1-2 minutes.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed.
)

echo.
echo [3/3] Launching Web Application on Local Port 3000...
echo.
echo ----------------------------------------------------------------------
echo  Local PC URL    : http://localhost:3000
echo  Opening Google Chrome automatically...
echo ----------------------------------------------------------------------
echo.

:: Automatically open Google Chrome or default browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the Vite server
call npm run dev -- --host 0.0.0.0 --port 3000

pause
