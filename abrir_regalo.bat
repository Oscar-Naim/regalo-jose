@echo off
title Songs for You - Regalo Digital
cd /d "%~dp0"
echo Abriendo tu regalo digital en http://localhost:8080 ...
start "" "http://localhost:8080"
python -m http.server 8080 --bind 127.0.0.1
