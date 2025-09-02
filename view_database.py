import sqlite3
import os

def view_database():
    """View database contents"""
    db_path = "receipts.db"
    
    if not os.path.exists(db_path):
        print("❌ Database tidak ditemukan!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("📊 DATABASE SISTEM NOTA PERUSAHAAN")
        print("=" * 60)
        
        # Lihat tabel receipts
        print("\n📋 TABEL RECEIPTS:")
        print("-" * 40)
        cursor.execute("SELECT * FROM receipts ORDER BY created_at DESC")
        receipts = cursor.fetchall()
        
        if receipts:
            print(f"{'ID':<3} {'Nomor Nota':<12} {'Perusahaan':<8} {'Tanggal':<12} {'Penerima':<20} {'Total':<12}")
            print("-" * 80)
            for receipt in receipts:
                print(f"{receipt[0]:<3} {receipt[1]:<12} {receipt[2]:<8} {receipt[4]:<12} {receipt[5]:<20} {receipt[7]:<12}")
        else:
            print("Belum ada data receipts")
        
        # Lihat tabel items
        print("\n📦 TABEL ITEMS:")
        print("-" * 40)
        cursor.execute("""
            SELECT i.id, r.receipt_number, i.quantity, i.item_type, i.size, i.color, i.unit_price, i.total_price
            FROM items i
            JOIN receipts r ON i.receipt_id = r.id
            ORDER BY i.id DESC
        """)
        items = cursor.fetchall()
        
        if items:
            print(f"{'ID':<3} {'Nota':<12} {'Qty':<8} {'Jenis Barang':<15} {'Ukuran':<8} {'Warna':<6} {'Harga':<8} {'Total':<10}")
            print("-" * 85)
            for item in items:
                print(f"{item[0]:<3} {item[1]:<12} {item[2]:<8} {item[3]:<15} {item[4]:<8} {item[5]:<6} {item[6]:<8} {item[7]:<10}")
        else:
            print("Belum ada data items")
        
        # Statistik
        print("\n📈 STATISTIK:")
        print("-" * 20)
        cursor.execute("SELECT COUNT(*) FROM receipts")
        total_receipts = cursor.fetchone()[0]
        print(f"Total Receipts: {total_receipts}")
        
        cursor.execute("SELECT COUNT(*) FROM items")
        total_items = cursor.fetchone()[0]
        print(f"Total Items: {total_items}")
        
        cursor.execute("SELECT SUM(total_amount) FROM receipts")
        total_amount = cursor.fetchone()[0] or 0
        print(f"Total Nilai: Rp {total_amount:,.0f}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    view_database()
    input("\nTekan Enter untuk keluar...")
