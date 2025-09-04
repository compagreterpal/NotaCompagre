@echo off
echo ========================================
echo    ADD ADDRESS COLUMN TO RECEIPTS
echo ========================================
echo.
echo Script ini akan menambahkan kolom 'address' ke tabel 'receipts'
echo.
echo LANGKAH-LANGKAH:
echo 1. Buka Supabase Dashboard
echo 2. Pergi ke SQL Editor
echo 3. Copy dan paste isi file: add_address_column.sql
echo 4. Klik "Run" untuk menjalankan script
echo.
echo File SQL: add_address_column.sql
echo.
echo Tekan Enter untuk membuka file SQL...
pause > nul
start notepad add_address_column.sql
echo.
echo Setelah menjalankan script SQL, tekan Enter untuk melanjutkan...
pause > nul
echo.
echo ========================================
echo    ADDRESS COLUMN ADDED SUCCESSFULLY!
echo ========================================
echo.
echo Sekarang Anda bisa:
echo 1. Restart aplikasi web
echo 2. Test buat nota baru dengan alamat
echo 3. Cek PDF untuk memastikan alamat muncul
echo.
pause
