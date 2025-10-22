@echo off
echo ============================================
echo  Create Symbolic Link to XAMPP
echo ============================================
echo.
echo This will create a symlink from XAMPP to your project
echo No need to copy files anymore!
echo.
echo IMPORTANT: This requires Administrator privileges
echo.
pause

REM Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Removing old directory if exists...
if exist "C:\xampp\htdocs\ASM-HRM" (
    rmdir /S /Q "C:\xampp\htdocs\ASM-HRM"
)

echo Creating symbolic link...
mklink /D "C:\xampp\htdocs\ASM-HRM" "%~dp0"

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo  SUCCESS! Symlink created!
    echo ============================================
    echo.
    echo Now XAMPP reads directly from:
    echo %~dp0
    echo.
    echo No need to copy files anymore!
    echo Just save and refresh browser!
) else (
    echo.
    echo ERROR: Failed to create symlink
    echo Make sure you run as Administrator
)

echo.
pause
