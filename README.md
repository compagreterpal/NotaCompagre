# Sistem Nota Perusahaan

Aplikasi desktop untuk mengelola dan mencetak nota untuk 3 perusahaan:
- PT. CHASTE GEMILANG MANDIRI (KODE: CH)
- PT CREATIVE GLOBAL MULIA (KODE: CR)  
- CV. COMPAGRE (KODE: CP)

## Fitur

- ✅ Input data nota dengan GUI yang user-friendly
- ✅ Pilihan 3 perusahaan dengan kode nota otomatis
- ✅ Manajemen item barang (quantity, jenis, ukuran, warna, harga)
- ✅ Perhitungan total otomatis
- ✅ Penyimpanan data ke database SQLite lokal
- ✅ Cetak nota dalam format PDF
- ✅ Riwayat nota yang sudah dibuat
- ✅ Auto-generate nomor nota

## Instalasi

### Cara 1: Install Dependencies dan Jalankan

1. Install Python 3.7+ jika belum ada
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Jalankan aplikasi:
```bash
python main.py
```

### Cara 2: Build Executable

1. Install PyInstaller:
```bash
pip install pyinstaller
```

2. Build executable:
```bash
python build_exe.py
```

3. Executable akan tersedia di folder `dist/SistemNotaPerusahaan.exe`

## Cara Penggunaan

1. **Pilih Perusahaan**: Pilih salah satu dari 3 perusahaan dari dropdown
2. **Nomor Nota**: Akan otomatis ter-generate berdasarkan perusahaan yang dipilih
3. **Tanggal**: Pilih tanggal nota
4. **Penerima**: Masukkan nama penerima nota
5. **Tambah Item**: 
   - Isi detail barang (banyaknya, jenis, ukuran, warna, harga)
   - Klik "Tambah Item"
   - Ulangi untuk item lainnya
6. **Simpan/Cetak**: 
   - Klik "Simpan Nota" untuk menyimpan ke database
   - Klik "Cetak Nota" untuk membuat PDF

## Struktur Database

Aplikasi menggunakan SQLite dengan 2 tabel:
- `receipts`: Menyimpan data nota
- `items`: Menyimpan detail item barang

## File Output

- Database: `receipts.db`
- PDF Nota: `nota_[NOMOR_NOTA].pdf`

## Troubleshooting

- Pastikan Python dan pip sudah terinstall
- Jika ada error saat install package, coba update pip: `pip install --upgrade pip`
- Untuk Windows, pastikan Visual C++ Redistributable sudah terinstall

## Support

Untuk bantuan atau pertanyaan, silakan hubungi developer.
