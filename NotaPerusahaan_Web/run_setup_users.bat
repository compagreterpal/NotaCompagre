@echo off
echo ========================================
echo SETUP USERS TABLE - NOTA PERUSAHAAN
echo ========================================
echo.
echo Langkah-langkah setup:
echo.
echo 1. Buka Supabase Dashboard
echo    - Login ke https://supabase.com
echo    - Pilih project kamu
echo.
echo 2. Buka SQL Editor
echo    - Klik menu "SQL Editor" di sidebar kiri
echo    - Klik "New Query"
echo.
echo 3. Copy dan paste isi file setup_users_table.sql
echo    - Buka file setup_users_table.sql di folder ini
echo    - Copy semua isinya
echo    - Paste ke SQL Editor di Supabase
echo    - Klik "Run" (▶️)
echo.
echo 4. Jika ada error RLS, jalankan fix_users_rls.sql
echo    - Buka file fix_users_rls.sql di folder ini
echo    - Copy semua isinya
echo    - Paste ke SQL Editor baru di Supabase
echo    - Klik "Run" (▶️)
echo.
echo 5. Test login dengan akun default:
echo    Username: admin
echo    Password: admin123
echo.
echo    Atau:
echo    Username: user  
echo    Password: user123
echo.
echo 6. Setelah setup selesai, jalankan aplikasi:
echo    cd NotaPerusahaan_Web
echo    python app.py
echo.
echo ========================================
pause
