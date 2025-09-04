# Nota Perusahaan Web App

Aplikasi web untuk membuat nota perusahaan dengan 3 perusahaan:
- PT. CHASTE GEMILANG MANDIRI (KODE: CH)
- PT CREATIVE GLOBAL MULIA (KODE: CR) 
- CV. COMPAGRE (KODE: CP)

## Deployment ke Vercel

### 1. Setup Environment Variables di Vercel
Buka dashboard Vercel → Settings → Environment Variables, tambahkan:
- `SUPABASE_URL`: URL Supabase Anda
- `SUPABASE_KEY`: Anon key Supabase Anda
- `SECRET_KEY`: Secret key untuk Flask session

### 2. File yang Dibutuhkan
- `vercel.json`: Konfigurasi Vercel
- `requirements.txt`: Dependencies Python
- `wsgi.py`: Entry point untuk Vercel
- `Procfile`: Untuk deployment
- `runtime.txt`: Versi Python

### 3. Deploy
1. Push ke GitHub
2. Connect repository ke Vercel
3. Deploy otomatis

## Local Development
```bash
pip install -r requirements.txt
python app.py
```

## Features
- Login/Register
- Buat nota dengan 3 perusahaan
- Generate PDF dengan logo
- Riwayat nota
- Export Excel