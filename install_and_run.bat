@echo off
echo ========================================
echo    SISTEM NOTA PERUSAHAAN
echo ========================================
echo.

echo Installing dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error installing dependencies!
    echo Please make sure Python and pip are installed.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting application...
python main.py

pause
