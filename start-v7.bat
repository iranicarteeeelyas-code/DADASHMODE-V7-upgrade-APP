@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js نصب نیست: https://nodejs.org & pause & exit /b 1)
node apply-v7.mjs
start "" http://localhost:3000
node tools/serve-v7.mjs 3000
pause
