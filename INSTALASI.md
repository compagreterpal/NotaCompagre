# PANDUAN INSTALASI SISTEM NOTA PERUSAHAAN

## Langkah 1: Install Python

### Untuk Windows:
1. Download Python dari https://www.python.org/downloads/
2. Pilih versi Python 3.8 atau lebih baru
3. **PENTING**: Saat instalasi, centang "Add Python to PATH"
4. Install dengan opsi default

### Verifikasi Instalasi:
Buka Command Prompt atau PowerShell, ketik:
```bash
python --version
```
Jika muncul versi Python, berarti instalasi berhasil.

## Langkah 2: Install Dependencies

Setelah Python terinstall, buka Command Prompt di folder aplikasi dan jalankan:

```bash
python -m pip install -r requirements.txt
```

Atau gunakan file batch yang sudah disediakan:
```bash
install_and_run.bat
```

## Langkah 3: Jalankan Aplikasi

### Cara 1: Langsung dari Python
```bash
python main.py
```

### Cara 2: Menggunakan file batch
Double click file `install_and_run.bat`

## Langkah 4: Build Executable (Opsional)

Jika ingin membuat file .exe yang bisa dijalankan tanpa Python:

1. Install PyInstaller:
```bash
python -m pip install pyinstaller
```

2. Build executable:
```bash
python build_exe.py
```

Atau gunakan file batch:
```bash
build_exe.bat
```

3. File executable akan tersedia di folder `dist/SistemNotaPerusahaan.exe`

## Troubleshooting

### Error: "python is not recognized"
- Python belum terinstall atau tidak ada di PATH
- Install ulang Python dengan centang "Add Python to PATH"

### Error: "pip is not recognized"
- Gunakan `python -m pip` sebagai gantinya
- Atau install pip secara manual

### Error saat install package
- Update pip: `python -m pip install --upgrade pip`
- Pastikan koneksi internet stabil

### Error saat build executable
- Pastikan PyInstaller terinstall: `python -m pip install pyinstaller`
- Pastikan semua dependencies terinstall

## Fitur Aplikasi

✅ **3 Perusahaan**: PT. CHASTE GEMILANG MANDIRI (CH), PT CREATIVE GLOBAL MULIA (CR), CV. COMPAGRE (CP)
✅ **Auto-generate nomor nota** berdasarkan perusahaan
✅ **Input detail barang** dengan perhitungan otomatis
✅ **Simpan ke database** SQLite lokal
✅ **Cetak PDF** nota yang sudah dibuat
✅ **Riwayat nota** yang sudah disimpan

## Support

Jika mengalami masalah, pastikan:
1. Python 3.7+ sudah terinstall
2. Semua dependencies terinstall dengan benar
3. Folder aplikasi memiliki permission write untuk database
