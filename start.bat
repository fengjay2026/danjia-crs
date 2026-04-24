@echo off
chcp 65001 >nul
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
echo 开始安装依赖...
call npm install
echo.
echo 启动程序...
call npm run dev

