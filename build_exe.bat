@echo off
echo ========================================
echo    BUILDING EXECUTABLE
echo ========================================
echo.

echo Installing PyInstaller...
pip install pyinstaller

if %errorlevel% neq 0 (
    echo Error installing PyInstaller!
    pause
    exit /b 1
)

echo.
echo Building executable...
python build_exe.py

if %errorlevel% neq 0 (
    echo Error building executable!
    pause
    exit /b 1
)

echo.
echo Executable built successfully!
echo Check the dist/ folder for SistemNotaPerusahaan.exe
echo.

pause
