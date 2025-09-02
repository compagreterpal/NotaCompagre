# 🚀 Quick Start Guide - Nota Perusahaan Web App

## ⚡ Langkah Cepat (5 Menit Setup)

### 1. Install Dependencies
```bash
# Double-click file ini:
install_dependencies.bat
```

### 2. Setup Supabase (3 menit)
1. Buka [supabase.com](https://supabase.com)
2. Sign up dengan GitHub/email
3. Buat project baru: `nota-perusahaan`
4. Copy Project URL dan Anon Key

### 3. Jalankan Aplikasi
```bash
# Double-click file ini:
run_app.bat
```

### 4. Konfigurasi Database
1. Buka browser: `http://localhost:5000`
2. Klik menu "Setup"
3. Masukkan Project URL dan Anon Key
4. Test koneksi

### 5. Mulai Pakai!
- Klik "Buat Nota" untuk input nota baru
- Klik "Riwayat" untuk lihat semua nota
- Data otomatis sinkron antar perangkat

## 🎯 Fitur Utama

✅ **3 Perusahaan**: CH, CR, CP  
✅ **Auto-calculator**: Quantity × Size × Price  
✅ **Real-time sync**: Antar laptop/komputer  
✅ **Export Excel**: Backup data otomatis  
✅ **Responsive**: Desktop + Mobile  

## 🔧 Jika Ada Error

### Error: "pip not found"
```bash
python -m pip install -r requirements.txt
```

### Error: "Database not configured"
- Pastikan sudah setup Supabase
- Cek Project URL dan Anon Key

### Error: "Module not found"
```bash
pip install flask supabase python-dotenv
```

## 📱 Akses dari Perangkat Lain

1. **Dari laptop lain**: `http://IP_ADDRESS:5000`
2. **Dari HP**: `http://IP_ADDRESS:5000`
3. **Ganti IP_ADDRESS** dengan IP komputer ini

## 🚀 Deploy ke Internet (Gratis)

### Vercel (Paling Mudah)
1. Upload ke GitHub
2. Connect ke Vercel
3. Auto-deploy

### Heroku
1. Install Heroku CLI
2. `heroku create`
3. `git push heroku main`

## 💡 Tips Penggunaan

- **Auto-save**: Data tersimpan otomatis
- **Search**: Cari nota berdasarkan nomor/penerima
- **Filter**: Filter berdasarkan perusahaan/tanggal
- **Export**: Backup data sebelum reset database

## 📞 Butuh Bantuan?

1. Cek README.md lengkap
2. Cek troubleshooting di README
3. Hubungi developer

---

**🎉 Selamat! Aplikasi Nota Perusahaan siap digunakan!**
