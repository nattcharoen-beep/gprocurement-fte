@echo off
chcp 65001 > nul
echo ===================================================
echo   FTE GPROCUREMENT FINDER - SEND EMAIL DIGEST
echo ===================================================
echo กำลังเริ่มระบบส่งอีเมลสรุปงาน...
echo.
cd /d "%~dp0\scraper"
node src/send-now.js
echo.
pause
