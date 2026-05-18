@echo off
chcp 65001 >nul
title 丹加留学顾问CRS

cd /d "%~dp0"

echo ====================================
echo      丹加留学顾问CRS 启动器
echo ====================================
echo.

rem 先停掉残留的vite进程（如果有）
taskkill /f /im node.exe /fi "WINDOWTITLE eq 丹加CRS" >nul 2>&1
timeout /t 1 /nobreak >nul

rem 在新窗口中启动 vite
echo [*] 正在启动 Vite 开发服务器...
start "丹加CRS" cmd /c "npx vite --host --port 3000"

rem 等待服务器就绪
set wait_count=0
:wait_loop
timeout /t 2 /nobreak >nul
set /a wait_count+=1
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% equ 0 goto ready
if %wait_count% lss 20 goto wait_loop

echo [FAIL] 服务器启动超时，请检查 vite 窗口是否有报错
pause
exit /b

:ready
echo [OK] 服务器启动成功！
echo 打开浏览器访问 http://localhost:3000
start "" http://localhost:3000
timeout /t 3 /nobreak >nul
exit
