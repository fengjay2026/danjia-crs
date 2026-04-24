@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo 开始构建...
call node node_modules\vite\bin\vite.js build --emptyOutDir
echo.
echo 构建完成!
pause
