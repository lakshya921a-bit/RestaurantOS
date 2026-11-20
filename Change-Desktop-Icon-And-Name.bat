@echo off
title RestaurantOS - Customize Desktop App Name & Icon
cd /d "%~dp0"

echo ================================================================
echo         RESTAURANTOS - CUSTOMIZE DESKTOP SHORTCUT & ICON
echo ================================================================
echo.
echo Customize how RestaurantOS appears on your Windows Desktop!
echo.

set /p APP_NAME="Enter new Desktop App Name [Press Enter for 'RestaurantOS']: "
if "%APP_NAME%"=="" set APP_NAME=RestaurantOS

echo.
echo Choose your App Icon Style:
echo  [1] Luxury Gold & Amber Cloche (Default)
echo  [2] Emerald Green Bistro Monogram
echo  [3] Ruby Flame & Grill Theme
echo  [4] Royal Sapphire Blue Monogram
echo  [5] Custom Icon (enter path to your own .ico file)
echo.

set /p ICON_CHOICE="Select an Icon [1-5, default: 1]: "
if "%ICON_CHOICE%"=="" set ICON_CHOICE=1

if "%ICON_CHOICE%"=="5" (
    echo.
    set /p CUSTOM_PATH="Enter the full path to your .ico file: "
    set ICON_CHOICE=%CUSTOM_PATH%
)

echo.
echo Updating Desktop Shortcut to '%APP_NAME%'...
powershell -ExecutionPolicy Bypass -File "scripts\customize-desktop-shortcut.ps1" -AppName "%APP_NAME%" -IconChoice "%ICON_CHOICE%"

echo.
echo ================================================================
echo Done! Check your Desktop for your updated '%APP_NAME%' icon.
echo ================================================================
echo.
pause
