# 🧾 Nota Perusahaan Web App

**Aplikasi web modern untuk manajemen nota perusahaan dengan sinkronisasi real-time menggunakan Supabase.**

## ✨ Fitur Utama

### 🏢 Multi-Perusahaan
- **PT. CHASTE GEMILANG MANDIRI** (CH) - dengan perhitungan PPN
- **PT CREATIVE GLOBAL MULIA** (CR) - tanpa PPN
- **CV. COMPAGRE** (CP) - tanpa PPN

### 📝 Manajemen Nota
- Form input nota yang lengkap
- Perhitungan otomatis (Quantity × Size × Unit Price)
- Validasi input real-time
- Auto-generate nomor nota berurutan
- Autocomplete penerima dari riwayat

### 💰 Perhitungan Otomatis
- **Perusahaan CH**: DPP + PPN 11%
- **Perusahaan CR/CP**: Diskon + DP + Sisa Bayar
- Deteksi otomatis jenis barang "terpal" untuk field ukuran

### 🔄 Sinkronisasi Real-Time
- Database cloud Supabase
- Sinkron otomatis antar perangkat
- Export data ke Excel
- Reset database dengan aman

### 📱 Responsive Design
- Interface modern dan user-friendly
- Bekerja optimal di desktop dan mobile
- Bootstrap 5 + custom styling

## 🚀 Cara Install & Setup

### 1. Prerequisites
- Python 3.8+ (sudah terinstall)
- pip (sudah terinstall)
- Browser modern (Chrome, Firefox, Edge)

### 2. Install Dependencies
```bash
cd NotaPerusahaan_Web
python -m pip install -r requirements.txt
```

### 3. Setup Supabase Database

#### A. Buat Akun Supabase
1. Buka [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Sign up dengan GitHub atau email
4. Verifikasi email

#### B. Buat Project Baru
1. Klik "New Project"
2. Pilih organization
3. Nama project: `nota-perusahaan`
4. Database password: buat yang kuat
5. Region: Singapore (terdekat)
6. Klik "Create new project"

#### C. Setup Database Schema
1. Buka "SQL Editor" di sidebar
2. Copy dan paste SQL script dari halaman Setup
3. Klik "Run"

#### D. Dapatkan API Keys
1. Buka "Settings" → "API"
2. Copy "Project URL"
3. Copy "anon public" key

### 4. Konfigurasi Aplikasi
1. Jalankan aplikasi: `python app.py`
2. Buka browser: `http://localhost:5000`
3. Klik menu "Setup"
4. Masukkan Project URL dan Anon Key
5. Test koneksi database

## 🎯 Cara Penggunaan

### Membuat Nota Baru
1. Pilih perusahaan dari dropdown
2. Nomor nota akan auto-generate
3. Isi tanggal dan penerima
4. Tambah item barang:
   - Quantity (misal: "2" atau "Dua (2) lbr")
   - Jenis barang (otomatis enable ukuran jika "terpal")
   - Ukuran (misal: "4X6")
   - Warna
   - Harga satuan
5. Klik "Simpan Nota"

### Melihat Riwayat
1. Klik menu "Riwayat"
2. Gunakan search dan filter
3. Double-click nota untuk detail
4. Export data jika diperlukan

### Export & Reset Database
1. Klik "Export & Reset Database"
2. Konfirmasi aksi
3. Data akan di-export ke Excel
4. Database akan di-reset

## 🏗️ Struktur Project

```
NotaPerusahaan_Web/
├── app.py                 # Flask application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates
│   ├── base.html         # Base template
│   ├── index.html        # Main page
│   ├── history.html      # History page
│   └── setup.html        # Setup page
├── static/                # Static assets
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   └── images/           # Images
└── README.md              # This file
```

## 🔧 Teknologi yang Digunakan

### Backend
- **Python Flask** - Web framework
- **Supabase** - Database cloud
- **SQLAlchemy** - Database ORM

### Frontend
- **Bootstrap 5** - CSS framework
- **Font Awesome** - Icons
- **jQuery** - JavaScript library
- **Vanilla JavaScript** - Custom functionality

### Database
- **PostgreSQL** (via Supabase)
- **Real-time subscriptions**
- **Row Level Security (RLS)**

## 📊 Database Schema

### Tabel `receipts`
- `id` - Primary key
- `receipt_number` - Nomor nota
- `company_code` - Kode perusahaan
- `company_name` - Nama perusahaan
- `date` - Tanggal nota
- `recipient` - Penerima
- `total_amount` - Total harga
- `created_at` - Timestamp

### Tabel `items`
- `id` - Primary key
- `receipt_id` - Foreign key ke receipts
- `quantity` - Jumlah barang
- `item_type` - Jenis barang
- `size` - Ukuran
- `color` - Warna
- `unit_price` - Harga satuan
- `total_price` - Total harga item

## 🌐 Deployment

### Local Development
```bash
python app.py
# Buka http://localhost:5000
```

### Production Deployment
1. **Vercel** (Gratis):
   ```bash
   pip install vercel
   vercel --prod
   ```

2. **Heroku** (Gratis tier):
   ```bash
   heroku create nota-perusahaan-app
   git push heroku main
   ```

3. **Railway** (Gratis):
   - Connect GitHub repository
   - Auto-deploy on push

## 🔒 Keamanan

- **Row Level Security (RLS)** di Supabase
- **Environment variables** untuk API keys
- **Input validation** di frontend dan backend
- **HTTPS** di production

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🐛 Troubleshooting

### Error: "Database not configured"
- Pastikan sudah setup Supabase
- Cek Project URL dan Anon Key
- Test koneksi di halaman Setup

### Error: "pip not found"
- Gunakan: `python -m pip install -r requirements.txt`

### Error: "Module not found"
- Install dependencies: `pip install -r requirements.txt`

### Database connection failed
- Cek internet connection
- Verifikasi Supabase project aktif
- Cek API keys sudah benar

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Cek troubleshooting di atas
2. Buka issue di GitHub
3. Hubungi developer

## 🚀 Roadmap

### Versi 1.1
- [ ] Export PDF nota
- [ ] Print langsung dari browser
- [ ] Backup otomatis ke Google Drive

### Versi 1.2
- [ ] Multi-user dengan login
- [ ] Role-based access control
- [ ] Audit trail

### Versi 2.0
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Advanced analytics

## 📄 License

MIT License - bebas digunakan untuk keperluan komersial dan non-komersial.

---

**Dibuat dengan ❤️ untuk memudahkan manajemen nota perusahaan**

*Last updated: February 2025*
