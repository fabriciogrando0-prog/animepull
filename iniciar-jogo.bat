@echo off
cd /d "%~dp0"
title AnimePull
npm run dev -- --open --port 5173 --strictPort
pause
