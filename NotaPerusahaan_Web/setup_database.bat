@echo off
echo ========================================
echo    Setup Database Nota Perusahaan
echo ========================================
echo.
echo Langkah-langkah setup database:
echo.
echo 1. Buka browser dan akses: http://localhost:5000/setup
echo 2. Masukkan Supabase URL dan API Key
echo 3. Klik "Test Connection" untuk memastikan koneksi
echo 4. Copy SQL script dari file setup_database.sql
echo 5. Buka Supabase Dashboard
echo 6. Klik "SQL Editor" di sidebar kiri
echo 7. Klik "New Query"
echo 8. Paste SQL script yang sudah di-copy
echo 9. Klik "Run" untuk menjalankan script
echo.
echo Setelah database setup selesai:
echo - Restart aplikasi Flask
echo - Test generate nomor nota otomatis
echo.
pause
