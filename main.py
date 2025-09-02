import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from tkcalendar import DateEntry
import sqlite3
from datetime import datetime
import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import webbrowser

class ReceiptApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sistem Nota Perusahaan")
        self.root.geometry("1000x700")
        
        # Database setup
        self.setup_database()
        
        # Company data
        self.companies = {
            "CH": "PT. CHASTE GEMILANG MANDIRI",
            "CR": "PT CREATIVE GLOBAL MULIA", 
            "CP": "CV. COMPAGRE"
        }
        
        self.create_widgets()
        
    def setup_database(self):
        self.conn = sqlite3.connect('receipts.db')
        self.cursor = self.conn.cursor()
        
        # Create receipts table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_number TEXT UNIQUE,
                company_code TEXT,
                company_name TEXT,
                date TEXT,
                recipient TEXT,
                items TEXT,
                total_amount REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create items table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_id INTEGER,
                quantity TEXT,
                item_type TEXT,
                size TEXT,
                color TEXT,
                unit_price REAL,
                total_price REAL,
                FOREIGN KEY (receipt_id) REFERENCES receipts (id)
            )
        ''')
        
        self.conn.commit()
        
    def create_widgets(self):
        # Configure root window style
        self.root.configure(bg='#f0f0f0')
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title with blue color like template
        title_label = tk.Label(main_frame, text="SISTEM NOTA PERUSAHAAN", 
                              font=("Arial", 18, "bold"), fg='#0066cc', bg='#f0f0f0')
        title_label.grid(row=0, column=0, columnspan=4, pady=(0, 20))
        
        # Company selection
        ttk.Label(main_frame, text="Pilih Perusahaan:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.company_var = tk.StringVar()
        company_combo = ttk.Combobox(main_frame, textvariable=self.company_var, 
                                    values=list(self.companies.keys()), state="readonly")
        company_combo.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=5)
        company_combo.bind('<<ComboboxSelected>>', self.on_company_select)
        
        # Company name display with blue color
        self.company_name_label = tk.Label(main_frame, text="", font=("Arial", 12, "bold"), 
                                          fg='#0066cc', bg='#f0f0f0')
        self.company_name_label.grid(row=1, column=2, columnspan=2, sticky=tk.W, pady=5)
        
        # Receipt number with red color like template
        ttk.Label(main_frame, text="Nomor Nota:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.receipt_number_var = tk.StringVar()
        self.receipt_number_entry = tk.Entry(main_frame, textvariable=self.receipt_number_var, 
                                            font=("Arial", 10, "bold"), fg='#cc0000', 
                                            relief='solid', bd=1)
        self.receipt_number_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5)
        
        # Date
        ttk.Label(main_frame, text="Tanggal:").grid(row=2, column=2, sticky=tk.W, pady=5)
        self.date_entry = DateEntry(main_frame, width=12, background='darkblue',
                                   foreground='white', borderwidth=2)
        self.date_entry.grid(row=2, column=3, sticky=tk.W, pady=5)
        
        # Recipient with autocomplete
        ttk.Label(main_frame, text="Kepada Yth:").grid(row=3, column=0, sticky=tk.W, pady=5)
        self.recipient_var = tk.StringVar()
        self.recipient_combo = ttk.Combobox(main_frame, textvariable=self.recipient_var, width=40)
        self.recipient_combo.grid(row=3, column=1, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        self.recipient_combo.bind('<KeyRelease>', self.filter_recipients)
        self.load_recipient_history()
        
        # Items section
        items_frame = ttk.LabelFrame(main_frame, text="Detail Barang", padding="10")
        items_frame.grid(row=4, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=10)
        
        # Items table with better styling
        columns = ('quantity', 'item_type', 'size', 'color', 'unit_price', 'total_price')
        self.items_tree = ttk.Treeview(items_frame, columns=columns, show='headings', height=6)
        
        # Define headings with bold text
        self.items_tree.heading('quantity', text='BANYAKNYA')
        self.items_tree.heading('item_type', text='JENIS BARANG')
        self.items_tree.heading('size', text='UKURAN')
        self.items_tree.heading('color', text='WARNA')
        self.items_tree.heading('unit_price', text='HARGA SATUAN')
        self.items_tree.heading('total_price', text='JUMLAH HARGA')
        
        # Define columns with better widths
        self.items_tree.column('quantity', width=120, anchor='center')
        self.items_tree.column('item_type', width=180, anchor='center')
        self.items_tree.column('size', width=100, anchor='center')
        self.items_tree.column('color', width=100, anchor='center')
        self.items_tree.column('unit_price', width=120, anchor='center')
        self.items_tree.column('total_price', width=120, anchor='center')
        
        self.items_tree.grid(row=0, column=0, columnspan=4, sticky=(tk.W, tk.E))
        
        # Scrollbar for items
        items_scrollbar = ttk.Scrollbar(items_frame, orient=tk.VERTICAL, command=self.items_tree.yview)
        items_scrollbar.grid(row=0, column=4, sticky=(tk.N, tk.S))
        self.items_tree.configure(yscrollcommand=items_scrollbar.set)
        
        # Item input fields
        input_frame = ttk.Frame(items_frame)
        input_frame.grid(row=1, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=10)
        
        ttk.Label(input_frame, text="Banyaknya:").grid(row=0, column=0, sticky=tk.W)
        self.quantity_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.quantity_var, width=15).grid(row=0, column=1, padx=5)
        
        ttk.Label(input_frame, text="Jenis Barang:").grid(row=0, column=2, sticky=tk.W)
        self.item_type_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.item_type_var, width=20).grid(row=0, column=3, padx=5)
        
        ttk.Label(input_frame, text="Ukuran:").grid(row=0, column=4, sticky=tk.W)
        self.size_var = tk.StringVar()
        self.size_entry = ttk.Entry(input_frame, textvariable=self.size_var, width=10)
        self.size_entry.grid(row=0, column=5, padx=5)
        # Bind event to check item type and control size input
        self.item_type_var.trace('w', self.on_item_type_change)
        
        ttk.Label(input_frame, text="Warna:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.color_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.color_var, width=15).grid(row=1, column=1, padx=5, pady=5)
        
        ttk.Label(input_frame, text="Harga Satuan:").grid(row=1, column=2, sticky=tk.W, pady=5)
        self.unit_price_var = tk.StringVar()
        ttk.Entry(input_frame, textvariable=self.unit_price_var, width=15).grid(row=1, column=3, padx=5, pady=5)
        
        # Add item button
        ttk.Button(input_frame, text="Tambah Item", command=self.add_item).grid(row=1, column=4, padx=5, pady=5)
        ttk.Button(input_frame, text="Hapus Item", command=self.remove_item).grid(row=1, column=5, padx=5, pady=5)
        
        # Calculation info
        calc_info = tk.Label(input_frame, text="Info: Total = Quantity × (Panjang × Lebar) × Harga Satuan", 
                            font=("Arial", 8), fg='#666666', bg='#f0f0f0')
        calc_info.grid(row=2, column=0, columnspan=6, pady=5)
        
        # Total and Tax calculation frame
        total_frame = ttk.Frame(main_frame)
        total_frame.grid(row=5, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=10)
        
        # DPP (Dasar Pengenaan Pajak) - only for CH company
        self.dpp_label = ttk.Label(total_frame, text="DPP:", font=("Arial", 12, "bold"))
        self.dpp_var = tk.StringVar(value="0")
        self.dpp_value_label = tk.Label(total_frame, textvariable=self.dpp_var, font=("Arial", 12, "bold"), 
                                       fg='#0066cc', bg='#f0f0f0')
        
        # PPN 11% - only for CH company
        self.ppn_label = ttk.Label(total_frame, text="PPN (11%):", font=("Arial", 12, "bold"))
        self.ppn_var = tk.StringVar(value="0")
        self.ppn_value_label = tk.Label(total_frame, textvariable=self.ppn_var, font=("Arial", 12, "bold"), 
                                       fg='#0066cc', bg='#f0f0f0')
        
        # TOTAL
        ttk.Label(total_frame, text="TOTAL:", font=("Arial", 14, "bold")).grid(row=0, column=0, sticky=tk.E, pady=5)
        self.total_var = tk.StringVar(value="0")
        total_label = tk.Label(total_frame, textvariable=self.total_var, font=("Arial", 14, "bold"), 
                              fg='#0066cc', bg='#f0f0f0')
        total_label.grid(row=0, column=1, sticky=tk.W, padx=10, pady=5)
        
        # Discount and DP frame - for non-CH companies
        discount_frame = ttk.Frame(main_frame)
        discount_frame.grid(row=6, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=10)
        
        # Discount input
        ttk.Label(discount_frame, text="Diskon (%/Rp):").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.discount_var = tk.StringVar()
        self.discount_entry = ttk.Entry(discount_frame, textvariable=self.discount_var, width=15)
        self.discount_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        self.discount_entry.bind('<KeyRelease>', self.update_total)
        
        # DP input
        ttk.Label(discount_frame, text="DP (Down Payment):").grid(row=0, column=2, sticky=tk.W, pady=5)
        self.dp_var = tk.StringVar()
        self.dp_entry = ttk.Entry(discount_frame, textvariable=self.dp_var, width=15)
        self.dp_entry.grid(row=0, column=3, sticky=tk.W, padx=5, pady=5)
        self.dp_entry.bind('<KeyRelease>', self.update_total)
        
        # Calculation breakdown - for non-CH companies
        self.total_before_discount_label = ttk.Label(discount_frame, text="Total Sebelum Potongan:", font=("Arial", 10, "bold"))
        self.total_before_discount_var = tk.StringVar(value="0")
        self.total_before_discount_value = tk.Label(discount_frame, textvariable=self.total_before_discount_var, 
                                                   font=("Arial", 10, "bold"), fg='#0066cc', bg='#f0f0f0')
        
        self.discount_amount_label = ttk.Label(discount_frame, text="Diskon:", font=("Arial", 10, "bold"))
        self.discount_amount_var = tk.StringVar(value="0")
        self.discount_amount_value = tk.Label(discount_frame, textvariable=self.discount_amount_var, 
                                             font=("Arial", 10, "bold"), fg='#cc0000', bg='#f0f0f0')
        
        self.total_after_discount_label = ttk.Label(discount_frame, text="Total Setelah Diskon:", font=("Arial", 10, "bold"))
        self.total_after_discount_var = tk.StringVar(value="0")
        self.total_after_discount_value = tk.Label(discount_frame, textvariable=self.total_after_discount_var, 
                                                  font=("Arial", 10, "bold"), fg='#0066cc', bg='#f0f0f0')
        
        self.dp_amount_label = ttk.Label(discount_frame, text="DP:", font=("Arial", 10, "bold"))
        self.dp_amount_var = tk.StringVar(value="0")
        self.dp_amount_value = tk.Label(discount_frame, textvariable=self.dp_amount_var, 
                                       font=("Arial", 10, "bold"), fg='#cc0000', bg='#f0f0f0')
        
        self.remaining_payment_label = ttk.Label(discount_frame, text="Sisa Perlu Bayar:", font=("Arial", 12, "bold"))
        self.remaining_payment_var = tk.StringVar(value="0")
        self.remaining_payment_value = tk.Label(discount_frame, textvariable=self.remaining_payment_var, 
                                               font=("Arial", 12, "bold"), fg='#0066cc', bg='#f0f0f0')
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=7, column=0, columnspan=4, pady=20)
        
        ttk.Button(button_frame, text="Simpan Nota", command=self.save_receipt).grid(row=0, column=0, padx=5)
        # ttk.Button(button_frame, text="Cetak Nota", command=self.print_receipt).grid(row=0, column=1, padx=5)
        ttk.Button(button_frame, text="Lihat Riwayat", command=self.view_history).grid(row=0, column=2, padx=5)
        ttk.Button(button_frame, text="Bersihkan Form", command=self.clear_form).grid(row=0, column=3, padx=5)
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.columnconfigure(3, weight=1)
        items_frame.columnconfigure(0, weight=1)
        input_frame.columnconfigure(1, weight=1)
        input_frame.columnconfigure(3, weight=1)
        
        # Initialize
        self.items = []
        self.recipient_history = []
        self.update_total()
        
    def on_company_select(self, event=None):
        company_code = self.company_var.get()
        if company_code in self.companies:
            self.company_name_label.config(text=self.companies[company_code])
            # Auto-generate receipt number
            self.generate_receipt_number()
            # Show/hide tax labels based on company
            self.update_tax_display()
            
    def generate_receipt_number(self):
        company_code = self.company_var.get()
        if company_code:
            # Get next number for this company
            self.cursor.execute('''
                SELECT MAX(CAST(SUBSTR(receipt_number, 3) AS INTEGER)) 
                FROM receipts 
                WHERE company_code = ?
            ''', (company_code,))
            result = self.cursor.fetchone()
            next_num = (result[0] or 0) + 1
            receipt_number = f"{company_code}{next_num:05d}"
            self.receipt_number_var.set(receipt_number)
            
    def load_recipient_history(self):
        """Load recipient history from database"""
        try:
            self.cursor.execute('''
                SELECT DISTINCT recipient 
                FROM receipts 
                WHERE recipient IS NOT NULL AND recipient != ''
                ORDER BY recipient
            ''')
            self.recipient_history = [row[0] for row in self.cursor.fetchall()]
            self.recipient_combo['values'] = self.recipient_history
        except Exception as e:
            print(f"Error loading recipient history: {e}")
            
    def filter_recipients(self, event=None):
        """Filter recipients based on user input"""
        current_text = self.recipient_var.get().lower()
        if current_text:
            filtered = [recipient for recipient in self.recipient_history 
                       if current_text in recipient.lower()]
            self.recipient_combo['values'] = filtered
        else:
            self.recipient_combo['values'] = self.recipient_history
            
    def add_item(self):
        try:
            quantity = self.quantity_var.get()
            item_type = self.item_type_var.get()
            size = self.size_var.get()
            color = self.color_var.get()
            unit_price = float(self.unit_price_var.get() or 0)
            
            # Parse quantity to get number (e.g., "Dua (2) lbr" -> 2, or "2" -> 2)
            quantity_num = 1
            if '(' in quantity and ')' in quantity:
                try:
                    quantity_num = int(quantity.split('(')[1].split(')')[0])
                except:
                    quantity_num = 1
            else:
                # If no parentheses, try to extract number from the beginning
                try:
                    # Extract first number from quantity string
                    numbers = re.findall(r'\d+', quantity)
                    if numbers:
                        quantity_num = int(numbers[0])
                except:
                    quantity_num = 1
            
            # Parse size to get length x width (e.g., "4X6" -> 4 x 6 = 24)
            size_area = 1
            if size and ('X' in size.upper() or 'x' in size):
                try:
                    size_parts = size.upper().replace('X', 'x').split('x')
                    if len(size_parts) == 2:
                        length = float(size_parts[0].strip())
                        width = float(size_parts[1].strip())
                        size_area = length * width
                except:
                    size_area = 1
            
            # Calculate total: quantity x size_area x unit_price
            total_price = quantity_num * size_area * unit_price
            
            # Check required fields based on item type
            item_type_lower = item_type.lower()
            if 'terpal' in item_type_lower:
                # For terpal, size is required
                if not all([quantity, item_type, size, color]):
                    messagebox.showwarning("Peringatan", "Semua field harus diisi untuk terpal!")
                    return
            else:
                # For non-terpal items, size is not required
                if not all([quantity, item_type, color]):
                    messagebox.showwarning("Peringatan", "Quantity, Jenis Barang, dan Warna harus diisi!")
                    return
                # Set size to "-" for non-terpal items if empty
                if not size:
                    size = "-"
                
            item = {
                'quantity': quantity,
                'item_type': item_type,
                'size': size,
                'color': color,
                'unit_price': unit_price,
                'total_price': total_price,
                'quantity_num': quantity_num,
                'size_area': size_area
            }
            
            self.items.append(item)
            self.items_tree.insert('', 'end', values=(
                quantity, item_type, size, color, f"{unit_price:,.0f}", f"{total_price:,.0f}"
            ))
            
            # Clear input fields
            self.quantity_var.set("")
            self.item_type_var.set("")
            self.size_var.set("")
            self.color_var.set("")
            self.unit_price_var.set("")
            
            # Reset size input state based on cleared item type
            self.size_entry.config(state='disabled')
            
            self.update_total()
            
        except ValueError:
            messagebox.showerror("Error", "Harga harus berupa angka!")
            
    def remove_item(self):
        selected_item = self.items_tree.selection()
        if selected_item:
            index = self.items_tree.index(selected_item[0])
            self.items.pop(index)
            self.items_tree.delete(selected_item[0])
            self.update_total()
            
    def on_item_type_change(self, *args):
        """Handle item type change to control size input"""
        item_type = self.item_type_var.get().strip().lower()
        
        # Check if item type contains 'terpal' (case insensitive)
        if 'terpal' in item_type:
            # Enable size input for terpal
            self.size_entry.config(state='normal')
            self.size_entry.config(style='TEntry')
        else:
            # Disable and clear size input for non-terpal items
            self.size_entry.config(state='disabled')
            self.size_var.set("")
    
    def update_total(self, event=None):
        subtotal = sum(item['total_price'] for item in self.items)
        
        # For CH company, show tax calculation
        if self.company_var.get() == "CH":
            self.dpp_var.set(f"{subtotal:,.0f}")
            # Calculate PPN 11%
            ppn = subtotal * 0.11
            self.ppn_var.set(f"{ppn:,.0f}")
            # Calculate total with PPN
            total = subtotal + ppn
            self.total_var.set(f"{total:,.0f}")
        else:
            # For other companies, calculate discount and DP
            self.total_before_discount_var.set(f"{subtotal:,.0f}")
            
            # Calculate discount
            discount_input = self.discount_var.get().strip()
            discount_amount = 0
            if discount_input:
                try:
                    if '%' in discount_input:
                        # Percentage discount
                        discount_percent = float(discount_input.replace('%', '').strip())
                        discount_amount = subtotal * (discount_percent / 100)
                    else:
                        # Fixed amount discount
                        discount_amount = float(discount_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    discount_amount = 0
            
            self.discount_amount_var.set(f"{discount_amount:,.0f}")
            
            # Calculate total after discount
            total_after_discount = subtotal - discount_amount
            self.total_after_discount_var.set(f"{total_after_discount:,.0f}")
            
            # Calculate DP
            dp_input = self.dp_var.get().strip()
            dp_amount = 0
            if dp_input:
                try:
                    dp_amount = float(dp_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    dp_amount = 0
            
            self.dp_amount_var.set(f"{dp_amount:,.0f}")
            
            # Calculate remaining payment
            remaining_payment = total_after_discount - dp_amount
            self.remaining_payment_var.set(f"{remaining_payment:,.0f}")
            
            # Set total as remaining payment
            self.total_var.set(f"{remaining_payment:,.0f}")
        
    def update_tax_display(self):
        """Show/hide tax labels and discount/DP fields based on selected company"""
        if self.company_var.get() == "CH":
            # Show tax labels for CH company
            self.dpp_label.grid(row=1, column=0, sticky=tk.E, pady=5)
            self.dpp_value_label.grid(row=1, column=1, sticky=tk.W, padx=10, pady=5)
            self.ppn_label.grid(row=2, column=0, sticky=tk.E, pady=5)
            self.ppn_value_label.grid(row=2, column=1, sticky=tk.W, padx=10, pady=5)
            
            # Hide discount/DP fields for CH company
            self.total_before_discount_label.grid_remove()
            self.total_before_discount_value.grid_remove()
            self.discount_amount_label.grid_remove()
            self.discount_amount_value.grid_remove()
            self.total_after_discount_label.grid_remove()
            self.total_after_discount_value.grid_remove()
            self.dp_amount_label.grid_remove()
            self.dp_amount_value.grid_remove()
            self.remaining_payment_label.grid_remove()
            self.remaining_payment_value.grid_remove()
        else:
            # Hide tax labels for other companies
            self.dpp_label.grid_remove()
            self.dpp_value_label.grid_remove()
            self.ppn_label.grid_remove()
            self.ppn_value_label.grid_remove()
            
            # Show discount/DP fields for other companies
            self.total_before_discount_label.grid(row=1, column=0, sticky=tk.E, pady=3)
            self.total_before_discount_value.grid(row=1, column=1, sticky=tk.W, padx=10, pady=3)
            self.discount_amount_label.grid(row=2, column=0, sticky=tk.E, pady=3)
            self.discount_amount_value.grid(row=2, column=1, sticky=tk.W, padx=10, pady=3)
            self.total_after_discount_label.grid(row=3, column=0, sticky=tk.E, pady=3)
            self.total_after_discount_value.grid(row=3, column=1, sticky=tk.W, padx=10, pady=3)
            self.dp_amount_label.grid(row=4, column=0, sticky=tk.E, pady=3)
            self.dp_amount_value.grid(row=4, column=1, sticky=tk.W, padx=10, pady=3)
            self.remaining_payment_label.grid(row=5, column=0, sticky=tk.E, pady=5)
            self.remaining_payment_value.grid(row=5, column=1, sticky=tk.W, padx=10, pady=5)
        
    def save_receipt(self):
        if not self.validate_form():
            return
            
        try:
            # Save receipt
            self.cursor.execute('''
                INSERT INTO receipts (receipt_number, company_code, company_name, date, recipient, total_amount)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                self.receipt_number_var.get(),
                self.company_var.get(),
                self.companies[self.company_var.get()],
                self.date_entry.get_date().strftime('%Y-%m-%d'),
                self.recipient_var.get(),
                float(self.total_var.get().replace(',', ''))
            ))
            
            receipt_id = self.cursor.lastrowid
            
            # Save items
            for item in self.items:
                self.cursor.execute('''
                    INSERT INTO items (receipt_id, quantity, item_type, size, color, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    receipt_id,
                    item['quantity'],
                    item['item_type'],
                    item['size'],
                    item['color'],
                    item['unit_price'],
                    item['total_price']
                ))
                
            self.conn.commit()
            
            # Auto-generate PDF after saving
            filename = f"nota_{self.receipt_number_var.get()}.pdf"
            self.create_pdf(filename)
            
            # Show success message with PDF info
            messagebox.showinfo("Sukses", f"Nota berhasil disimpan!\n\nPDF telah dibuat: {filename}\n\nKlik OK untuk membuka PDF.")
            
            # Open PDF automatically
            try:
                webbrowser.open(filename)
            except:
                messagebox.showinfo("Info", f"PDF berhasil dibuat: {filename}")
            
            self.clear_form()
            
        except Exception as e:
            messagebox.showerror("Error", f"Gagal menyimpan nota: {str(e)}")
            
    def validate_form(self):
        if not self.company_var.get():
            messagebox.showwarning("Peringatan", "Pilih perusahaan!")
            return False
        if not self.receipt_number_var.get():
            messagebox.showwarning("Peringatan", "Nomor nota harus diisi!")
            return False
        if not self.recipient_var.get():
            messagebox.showwarning("Peringatan", "Penerima harus diisi!")
            return False
        if not self.items:
            messagebox.showwarning("Peringatan", "Tambah minimal satu item!")
            return False
        return True
        
    def print_receipt(self):
        if not self.validate_form():
            return
            
        # Create PDF
        filename = f"nota_{self.receipt_number_var.get()}.pdf"
        self.create_pdf(filename)
        
        # Open PDF
        try:
            webbrowser.open(filename)
        except:
            messagebox.showinfo("Info", f"PDF berhasil dibuat: {filename}")
            
    def create_pdf(self, filename):
        # Set narrow margins for A4
        doc = SimpleDocTemplate(filename, pagesize=A4, 
                              leftMargin=0.5*inch, rightMargin=0.5*inch,
                              topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=14,
            spaceAfter=10,
            alignment=1,
            textColor=colors.HexColor('#0066cc')
        )
        
        company_name = self.companies[self.company_var.get()]
        
        # Different format for CH company (Invoice format)
        if self.company_var.get() == "CH":
            self.create_invoice_pdf(elements, company_name, styles)
        else:
            # Original format for other companies
            self.create_receipt_pdf(elements, company_name, styles)
        
        # Build PDF
        doc.build(elements)
        
    def create_invoice_pdf(self, elements, company_name, styles):
        """Create invoice format for PT. CHASTE GEMILANG MANDIRI"""
        
        # Create title style for invoice
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=10,
            alignment=1,
            textColor=colors.HexColor('#0066cc'),
            fontName='Helvetica-Bold'
        )
        
        # Header with logo and company name
        logo_path = "CHASTE GEMILANG MANDIRI.png"
        if os.path.exists(logo_path):
            logo_img = Image(logo_path, width=80, height=50)
            elements.append(logo_img)
            elements.append(Spacer(1, 8))
        
        elements.append(Paragraph(company_name, title_style))
        elements.append(Spacer(1, 20))
        
        # Invoice info with better spacing
        invoice_info = [
            ['DATE:', self.date_entry.get_date().strftime('%d/%m/%Y')],
            ['NO. INVOICE:', self.receipt_number_var.get()],
            ['BILL TO:', self.recipient_var.get()]
        ]
        
        invoice_table = Table(invoice_info, colWidths=[100, 250])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(invoice_table)
        elements.append(Spacer(1, 20))
        
        # Items table with improved invoice format
        items_data = [['NO.', 'DESKRIPSI', 'HARGA', 'QTY', 'JUMLAH']]
        for i, item in enumerate(self.items, 1):
            items_data.append([
                str(i),
                f"{item['item_type']} {item['color']} {item['size']}",
                f"Rp{item['unit_price']:,.0f}",
                item['quantity'],
                f"Rp{item['total_price']:,.0f}"
            ])
            
        items_table = Table(items_data, colWidths=[40, 220, 90, 60, 90])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#666666')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),  # NO. column centered
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),    # DESKRIPSI left aligned
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),   # HARGA right aligned
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),  # QTY centered
            ('ALIGN', (4, 0), (4, -1), 'RIGHT'),   # JUMLAH right aligned
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        
        # Tax calculation summary (right aligned with better formatting)
        subtotal = sum(item['total_price'] for item in self.items)
        ppn = subtotal * 0.11
        total = subtotal + ppn
        
        tax_summary = [
            ['DPP', f"Rp{subtotal:,.0f}"],
            ['PPN (11%)', f"Rp{ppn:,.0f}"],
            ['TOTAL', f"Rp{total:,.0f}"]
        ]
        
        tax_table = Table(tax_summary, colWidths=[120, 120])
        tax_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        # Position tax table to the right
        tax_frame = Table([[tax_table]], colWidths=[500])
        tax_frame.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
        ]))
        elements.append(tax_frame)
        elements.append(Spacer(1, 15))
        
        # Terbilang with better formatting
        terbilang_text = f"TERBILANG: {self.number_to_words(int(total))} RUPIAH"
        elements.append(Paragraph(terbilang_text, ParagraphStyle(
            'Terbilang',
            parent=styles['Normal'],
            fontSize=10,
            alignment=0,
            fontName='Helvetica-Bold',
            spaceAfter=20
        )))
        
        # Footer with contact info and payment method - improved layout
        footer_data = [
            ['Telepon: 031-5990710', '', 'PAYMENT METHOD:'],
            ['Jl. Mulyosari Prima Utara VI/MM-16,', '', 'BANK CENTRAL ASIA (BCA)'],
            ['Kalisari, Mulyorejo, Surabaya', '', '5060507475'],
            ['', '', ''],
            ['Hormat Kami,', '', 'PT. CHASTE GEMILANG MANDIRI']
        ]
        
        footer_table = Table(footer_data, colWidths=[180, 40, 180])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),    # Left column left aligned
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),  # Middle column centered
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),   # Right column right aligned
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(footer_table)
        
    def create_receipt_pdf(self, elements, company_name, styles):
        """Create original receipt format for other companies - 2 receipts per page"""
        
        # Create title style for receipt
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=12,
            spaceAfter=8,
            alignment=1,
            textColor=colors.HexColor('#0066cc')
        )
        
        # Add logo for CH company
        if self.company_var.get() == "CH":
            logo_path = "CHASTE GEMILANG MANDIRI.png"
            if os.path.exists(logo_path):
                logo_img = Image(logo_path, width=40, height=25)
                elements.append(logo_img)
                elements.append(Spacer(1, 2))
            
            elements.append(Paragraph(company_name, title_style))
        else:
            elements.append(Paragraph(company_name, title_style))
            
        elements.append(Spacer(1, 8))
        
        # Receipt info
        receipt_info = [
            ['Surabaya,', self.date_entry.get_date().strftime('%d %B %Y')],
            ['Kepada Yth:', self.recipient_var.get()],
            ['NOTA / INVOICE :', self.receipt_number_var.get()],
        ]
        
        receipt_table = Table(receipt_info, colWidths=[80, 160])
        receipt_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#cc0000')),
        ]))
        elements.append(receipt_table)
        elements.append(Spacer(1, 8))
        
        # Items table
        items_data = [['BANYAKNYA', 'JENIS BARANG', 'UKURAN', 'WARNA', 'HARGA SATUAN', 'JUMLAH HARGA']]
        for item in self.items:
            items_data.append([
                item['quantity'],
                item['item_type'],
                item['size'],
                item['color'],
                f"{item['unit_price']:,.0f}",
                f"{item['total_price']:,.0f}"
            ])
            
        items_table = Table(items_data, colWidths=[50, 80, 40, 40, 60, 60])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 6),
            ('FONTSIZE', (0, 1), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 8))
        
        # Total calculation with discount and DP for non-CH companies
        total_style = ParagraphStyle(
            'TotalStyle',
            parent=styles['Heading2'],
            fontSize=9,
            textColor=colors.HexColor('#0066cc'),
            alignment=1
        )
        
        if self.company_var.get() != "CH":
            # Calculate all values for non-CH companies
            subtotal = sum(item['total_price'] for item in self.items)
            
            # Calculate discount
            discount_input = self.discount_var.get().strip()
            discount_amount = 0
            if discount_input:
                try:
                    if '%' in discount_input:
                        discount_percent = float(discount_input.replace('%', '').strip())
                        discount_amount = subtotal * (discount_percent / 100)
                    else:
                        discount_amount = float(discount_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    discount_amount = 0
            
            # Calculate total after discount
            total_after_discount = subtotal - discount_amount
            
            # Calculate DP
            dp_input = self.dp_var.get().strip()
            dp_amount = 0
            if dp_input:
                try:
                    dp_amount = float(dp_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    dp_amount = 0
            
            # Calculate remaining payment
            remaining_payment = total_after_discount - dp_amount
            
            # Create detailed total breakdown
            total_breakdown = [
                ['Total Sebelum Potongan:', f"{subtotal:,.0f}"],
                ['Diskon:', f"{discount_amount:,.0f}"],
                ['Total Setelah Diskon:', f"{total_after_discount:,.0f}"],
                ['DP:', f"{dp_amount:,.0f}"],
                ['Sisa Perlu Bayar:', f"{remaining_payment:,.0f}"]
            ]
            
            total_table = Table(total_breakdown, colWidths=[150, 100])
            total_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0066cc')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0066cc')),
            ]))
            
            # Position total table to the right
            total_frame = Table([[total_table]], colWidths=[400])
            total_frame.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
            ]))
            elements.append(total_frame)
        else:
            total_text = f"TOTAL: {self.total_var.get()}"
            elements.append(Paragraph(total_text, total_style))
        
        # Signature lines
        elements.append(Spacer(1, 12))
        signature_data = [['Tanda Tangan,', '', 'Hormat Kami,']]
        signature_table = Table(signature_data, colWidths=[100, 100, 100])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
        ]))
        elements.append(signature_table)
        
        # Check if content is too long for one page
        # Estimate the height of current content
        estimated_height = len(self.items) * 20 + 200  # Rough estimation
        
        # If content is too long, add page break before copy receipt
        if estimated_height > 400:  # Threshold for page break
            elements.append(Spacer(1, 50))
            # Add page break
            elements.append(Paragraph('<pagebreak/>', styles['Normal']))
            elements.append(Spacer(1, 20))
        else:
            # Add spacing between first and second receipt - increased spacing
            elements.append(Spacer(1, 50))
        
        # SECOND RECEIPT (COPY) - with faded red background
        # Create a frame with background color for the second receipt
        copy_receipt_data = []
        
        # Header for copy
        copy_receipt_data.append([Paragraph(company_name, title_style)])
        copy_receipt_data.append([Spacer(1, 8)])
        
        # Receipt info for copy
        copy_receipt_info = [
            ['Surabaya,', self.date_entry.get_date().strftime('%d %B %Y')],
            ['Kepada Yth:', self.recipient_var.get()],
            ['NOTA / INVOICE :', self.receipt_number_var.get()],
        ]
        
        copy_receipt_table = Table(copy_receipt_info, colWidths=[80, 160])
        copy_receipt_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#cc0000')),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFE6E6')),  # Light red background
        ]))
        copy_receipt_data.append([copy_receipt_table])
        copy_receipt_data.append([Spacer(1, 8)])
        
        # Items table for copy
        copy_items_data = [['BANYAKNYA', 'JENIS BARANG', 'UKURAN', 'WARNA', 'HARGA SATUAN', 'JUMLAH HARGA']]
        for item in self.items:
            copy_items_data.append([
                item['quantity'],
                item['item_type'],
                item['size'],
                item['color'],
                f"{item['unit_price']:,.0f}",
                f"{item['total_price']:,.0f}"
            ])
            
        copy_items_table = Table(copy_items_data, colWidths=[50, 80, 40, 40, 60, 60])
        copy_items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 6),
            ('FONTSIZE', (0, 1), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFE6E6')),  # Light red background for data rows
        ]))
        copy_receipt_data.append([copy_items_table])
        copy_receipt_data.append([Spacer(1, 8)])
        
        # Total for copy with breakdown
        if self.company_var.get() != "CH":
            # Calculate all values for copy
            subtotal = sum(item['total_price'] for item in self.items)
            
            # Calculate discount
            discount_input = self.discount_var.get().strip()
            discount_amount = 0
            if discount_input:
                try:
                    if '%' in discount_input:
                        discount_percent = float(discount_input.replace('%', '').strip())
                        discount_amount = subtotal * (discount_percent / 100)
                    else:
                        discount_amount = float(discount_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    discount_amount = 0
            
            # Calculate total after discount
            total_after_discount = subtotal - discount_amount
            
            # Calculate DP
            dp_input = self.dp_var.get().strip()
            dp_amount = 0
            if dp_input:
                try:
                    dp_amount = float(dp_input.replace(',', '').replace('Rp', '').strip())
                except ValueError:
                    dp_amount = 0
            
            # Calculate remaining payment
            remaining_payment = total_after_discount - dp_amount
            
            # Create detailed total breakdown for copy
            copy_total_breakdown = [
                ['Total Sebelum Potongan:', f"{subtotal:,.0f}"],
                ['Diskon:', f"{discount_amount:,.0f}"],
                ['Total Setelah Diskon:', f"{total_after_discount:,.0f}"],
                ['DP:', f"{dp_amount:,.0f}"],
                ['Sisa Perlu Bayar:', f"{remaining_payment:,.0f}"]
            ]
            
            copy_total_table = Table(copy_total_breakdown, colWidths=[150, 100])
            copy_total_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0066cc')),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0066cc')),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFE6E6')),  # Light red background
            ]))
            
            # Position copy total table to the right
            copy_total_frame = Table([[copy_total_table]], colWidths=[400])
            copy_total_frame.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
            ]))
            copy_receipt_data.append([copy_total_frame])
        else:
            copy_total_style = ParagraphStyle(
                'CopyTotalStyle',
                parent=styles['Heading2'],
                fontSize=9,
                textColor=colors.HexColor('#0066cc'),
                alignment=1
            )
            copy_receipt_data.append([Paragraph(total_text, copy_total_style)])
        
        # Signature lines for copy
        copy_receipt_data.append([Spacer(1, 12)])
        copy_signature_data = [['Tanda Tangan,', '', 'Hormat Kami,']]
        copy_signature_table = Table(copy_signature_data, colWidths=[100, 100, 100])
        copy_signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFE6E6')),  # Light red background
        ]))
        copy_receipt_data.append([copy_signature_table])
        
        # Add extra space below signature for signing area (approximately 15mm)
        copy_receipt_data.append([Spacer(1, 25)])
        
        # Create the copy receipt frame with background
        copy_receipt_frame = Table(copy_receipt_data, colWidths=[400])
        copy_receipt_frame.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FFE6E6')),  # Light red background
            ('LEFTPADDING', (0, 0), (0, -1), 15),
            ('RIGHTPADDING', (0, 0), (0, -1), 15),
            ('TOPPADDING', (0, 0), (0, -1), 15),
            ('BOTTOMPADDING', (0, 0), (0, -1), 20),  # Extra bottom padding for signing area
        ]))
        
        elements.append(copy_receipt_frame)
        
    def number_to_words(self, number):
        """Convert number to Indonesian words"""
        units = ["", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "DELAPAN", "SEMBILAN"]
        teens = ["SEPULUH", "SEBELAS", "DUA BELAS", "TIGA BELAS", "EMPAT BELAS", "LIMA BELAS", 
                "ENAM BELAS", "TUJUH BELAS", "DELAPAN BELAS", "SEMBILAN BELAS"]
        tens = ["", "", "DUA PULUH", "TIGA PULUH", "EMPAT PULUH", "LIMA PULUH", 
               "ENAM PULUH", "TUJUH PULUH", "DELAPAN PULUH", "SEMBILAN PULUH"]
        
        if number == 0:
            return "NOL"
        elif number < 10:
            return units[number]
        elif number < 20:
            return teens[number - 10]
        elif number < 100:
            if number % 10 == 0:
                return tens[number // 10]
            else:
                return f"{tens[number // 10]} {units[number % 10]}"
        elif number < 1000:
            if number % 100 == 0:
                return f"{units[number // 100]} RATUS"
            else:
                return f"{units[number // 100]} RATUS {self.number_to_words(number % 100)}"
        elif number < 1000000:
            if number % 1000 == 0:
                return f"{self.number_to_words(number // 1000)} RIBU"
            else:
                return f"{self.number_to_words(number // 1000)} RIBU {self.number_to_words(number % 1000)}"
        elif number < 1000000000:
            if number % 1000000 == 0:
                return f"{self.number_to_words(number // 1000000)} JUTA"
            else:
                return f"{self.number_to_words(number // 1000000)} JUTA {self.number_to_words(number % 1000000)}"
        else:
            return "SANGAT BESAR"
        
    def view_history(self):
        # Create history window
        history_window = tk.Toplevel(self.root)
        history_window.title("Riwayat Nota")
        history_window.geometry("800x600")
        
        # Create treeview for history
        columns = ('receipt_number', 'company_name', 'date', 'recipient', 'total_amount')
        history_tree = ttk.Treeview(history_window, columns=columns, show='headings')
        
        history_tree.heading('receipt_number', text='Nomor Nota')
        history_tree.heading('company_name', text='Perusahaan')
        history_tree.heading('date', text='Tanggal')
        history_tree.heading('recipient', text='Penerima')
        history_tree.heading('total_amount', text='Total')
        
        history_tree.column('receipt_number', width=120)
        history_tree.column('company_name', width=200)
        history_tree.column('date', width=100)
        history_tree.column('recipient', width=200)
        history_tree.column('total_amount', width=100)
        
        # Add double-click event to view details
        history_tree.bind('<Double-1>', lambda e: self.view_receipt_details(history_tree, history_window))
        
        history_tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Add instruction label
        instruction_label = tk.Label(history_window, text="💡 Double-click pada baris untuk melihat detail nota", 
                                   font=("Arial", 10), fg='#666666')
        instruction_label.pack(pady=5)
        
        # Load data
        self.cursor.execute('''
            SELECT receipt_number, company_name, date, recipient, total_amount
            FROM receipts
            ORDER BY created_at DESC
        ''')
        
        for row in self.cursor.fetchall():
            history_tree.insert('', 'end', values=(
                row[0], row[1], row[2], row[3], f"{row[4]:,.0f}"
            ))
            
    def clear_form(self):
        # Don't clear company and receipt number - keep them for continuity
        # self.company_var.set("")  # Keep current company
        # self.company_name_label.config(text="")  # Keep current company name
        # self.receipt_number_var.set("")  # Keep current receipt number
        
        self.recipient_var.set("")
        self.quantity_var.set("")
        self.item_type_var.set("")
        self.size_var.set("")
        self.color_var.set("")
        self.unit_price_var.set("")
        self.items = []
        
        # Clear treeview
        for item in self.items_tree.get_children():
            self.items_tree.delete(item)
            
        # Reset tax variables
        self.dpp_var.set("0")
        self.ppn_var.set("0")
        self.total_var.set("0")
        
        # Reset discount and DP variables
        self.discount_var.set("")
        self.dp_var.set("")
        self.total_before_discount_var.set("0")
        self.discount_amount_var.set("0")
        self.total_after_discount_var.set("0")
        self.dp_amount_var.set("0")
        self.remaining_payment_var.set("0")
        
        # Hide tax labels when clearing form
        self.update_tax_display()
            
        # Reload recipient history after clearing
        self.load_recipient_history()
        self.update_total()
            
    def view_receipt_details(self, history_tree, history_window):
        """View detailed receipt information"""
        selected_item = history_tree.selection()
        if not selected_item:
            return
            
        # Get receipt number from selected item
        receipt_number = history_tree.item(selected_item[0])['values'][0]
        
        # Get receipt details from database
        self.cursor.execute('''
            SELECT receipt_number, company_name, date, recipient, total_amount
            FROM receipts
            WHERE receipt_number = ?
        ''', (receipt_number,))
        
        receipt_data = self.cursor.fetchone()
        if not receipt_data:
            messagebox.showerror("Error", "Data nota tidak ditemukan!")
            return
            
        # Get items for this receipt
        self.cursor.execute('''
            SELECT quantity, item_type, size, color, unit_price, total_price
            FROM items
            WHERE receipt_id = (SELECT id FROM receipts WHERE receipt_number = ?)
        ''', (receipt_number,))
        
        items_data = self.cursor.fetchall()
        
        # Create detail window
        detail_window = tk.Toplevel(history_window)
        detail_window.title(f"Detail Nota - {receipt_number}")
        detail_window.geometry("900x600")
        
        # Main frame
        main_frame = ttk.Frame(detail_window, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Receipt info
        info_frame = ttk.LabelFrame(main_frame, text="Informasi Nota", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        info_data = [
            ["Nomor Nota:", receipt_data[0]],
            ["Perusahaan:", receipt_data[1]],
            ["Tanggal:", receipt_data[2]],
            ["Penerima:", receipt_data[3]],
            ["Total:", f"{receipt_data[4]:,.0f}"]
        ]
        
        for i, (label, value) in enumerate(info_data):
            ttk.Label(info_frame, text=label, font=("Arial", 10, "bold")).grid(row=i, column=0, sticky=tk.W, pady=2)
            ttk.Label(info_frame, text=value, font=("Arial", 10)).grid(row=i, column=1, sticky=tk.W, padx=10, pady=2)
        
        # Items frame
        items_frame = ttk.LabelFrame(main_frame, text="Detail Barang", padding="10")
        items_frame.pack(fill=tk.BOTH, expand=True)
        
        # Items table
        columns = ('quantity', 'item_type', 'size', 'color', 'unit_price', 'total_price')
        items_tree = ttk.Treeview(items_frame, columns=columns, show='headings', height=10)
        
        items_tree.heading('quantity', text='BANYAKNYA')
        items_tree.heading('item_type', text='JENIS BARANG')
        items_tree.heading('size', text='UKURAN')
        items_tree.heading('color', text='WARNA')
        items_tree.heading('unit_price', text='HARGA SATUAN')
        items_tree.heading('total_price', text='JUMLAH HARGA')
        
        items_tree.column('quantity', width=100, anchor='center')
        items_tree.column('item_type', width=150, anchor='center')
        items_tree.column('size', width=80, anchor='center')
        items_tree.column('color', width=80, anchor='center')
        items_tree.column('unit_price', width=100, anchor='center')
        items_tree.column('total_price', width=100, anchor='center')
        
        items_tree.pack(fill=tk.BOTH, expand=True)
        
        # Load items data
        for item in items_data:
            items_tree.insert('', 'end', values=(
                item[0], item[1], item[2], item[3], f"{item[4]:,.0f}", f"{item[5]:,.0f}"
            ))
        
        # Buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)
        
        # Check if PDF exists
        pdf_filename = f"nota_{receipt_number}.pdf"
        pdf_exists = os.path.exists(pdf_filename)
        
        if pdf_exists:
            ttk.Button(button_frame, text="Buka PDF", 
                      command=lambda: webbrowser.open(pdf_filename)).pack(side=tk.LEFT, padx=5)
        else:
            ttk.Button(button_frame, text="Buat PDF", 
                      command=lambda: self.create_pdf_for_existing_receipt(receipt_number)).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(button_frame, text="Tutup", 
                  command=detail_window.destroy).pack(side=tk.LEFT, padx=5)
        
    def create_pdf_for_existing_receipt(self, receipt_number):
        """Create PDF for an existing receipt"""
        try:
            # Get receipt data
            self.cursor.execute('''
                SELECT company_code, company_name, date, recipient, total_amount
                FROM receipts
                WHERE receipt_number = ?
            ''', (receipt_number,))
            
            receipt_data = self.cursor.fetchone()
            if not receipt_data:
                messagebox.showerror("Error", "Data nota tidak ditemukan!")
                return
                
            # Get items data
            self.cursor.execute('''
                SELECT quantity, item_type, size, color, unit_price, total_price
                FROM items
                WHERE receipt_id = (SELECT id FROM receipts WHERE receipt_number = ?)
            ''', (receipt_number,))
            
            items_data = self.cursor.fetchall()
            
            # Create temporary items list for PDF generation
            temp_items = []
            for item in items_data:
                temp_items.append({
                    'quantity': item[0],
                    'item_type': item[1],
                    'size': item[2],
                    'color': item[3],
                    'unit_price': item[4],
                    'total_price': item[5]
                })
            
            # Temporarily set current data for PDF generation
            original_items = self.items
            original_company_var = self.company_var.get()
            original_receipt_number_var = self.receipt_number_var.get()
            original_recipient_var = self.recipient_var.get()
            original_date = self.date_entry.get_date()
            
            self.items = temp_items
            self.company_var.set(receipt_data[0])
            self.receipt_number_var.set(receipt_number)
            self.recipient_var.set(receipt_data[3])
            
            # Create PDF
            filename = f"nota_{receipt_number}.pdf"
            self.create_pdf(filename)
            
            # Restore original data
            self.items = original_items
            self.company_var.set(original_company_var)
            self.receipt_number_var.set(original_receipt_number_var)
            self.recipient_var.set(original_recipient_var)
            
            messagebox.showinfo("Sukses", f"PDF berhasil dibuat: {filename}")
            
            # Open PDF
            try:
                webbrowser.open(filename)
            except:
                pass
                
        except Exception as e:
            messagebox.showerror("Error", f"Gagal membuat PDF: {str(e)}")

def main():
    root = tk.Tk()
    app = ReceiptApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
