from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from supabase import create_client, Client
from config import Config
import os
import pandas as pd
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import hashlib
import secrets

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = app.config.get('SECRET_KEY', 'rahasia123456789')

def get_supabase():
    """Get Supabase client"""
    try:
        if not app.config.get('SUPABASE_URL') or not app.config.get('SUPABASE_KEY'):
            return None
        
        supabase: Client = create_client(
            app.config['SUPABASE_URL'],
            app.config['SUPABASE_KEY']
        )
        return supabase
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return None

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def require_login(f):
    """Decorator to require login for protected routes"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
@require_login
def index():
    # Define companies data for the template
    companies = [
        {'code': 'CH', 'name': 'PT. CHASTE GEMILANG MANDIRI'},
        {'code': 'CR', 'name': 'PT CREATIVE GLOBAL MULIA'},
        {'code': 'CP', 'name': 'CV. COMPAGRE'}
    ]
    return render_template('index.html', companies=companies, username=session.get('username'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username dan password harus diisi'}), 400
        
        try:
            db = get_supabase()
            if not db:
                return jsonify({'error': 'Database not configured'}), 500
            
            # Check if users table exists, if not create it
            try:
                response = db.table('users').select('*').eq('username', username).execute()
            except Exception as e:
                print(f"Error accessing users table: {e}")
                # For now, just return error - user needs to run setup_users_table.sql first
                return jsonify({'error': 'Users table not found. Please run setup_users_table.sql in Supabase first.'}), 500
            
            if not response.data:
                return jsonify({'error': 'Username tidak ditemukan'}), 401
            
            user = response.data[0]
            hashed_password = hash_password(password)
            
            if user['password'] != hashed_password:
                return jsonify({'error': 'Password salah'}), 401
            
            # Set session
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['full_name'] = user['full_name']
            
            return jsonify({'success': True, 'redirect': '/'})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        full_name = data.get('fullName')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        
        # Validation
        if not all([full_name, username, email, password, confirm_password]):
            return jsonify({'error': 'Semua field harus diisi'}), 400
        
        if password != confirm_password:
            return jsonify({'error': 'Password tidak cocok'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password minimal 6 karakter'}), 400
        
        try:
            db = get_supabase()
            if not db:
                return jsonify({'error': 'Database not configured'}), 500
            
            # Check if username already exists
            existing_user = db.table('users').select('*').eq('username', username).execute()
            if existing_user.data:
                return jsonify({'error': 'Username sudah digunakan'}), 400
            
            # Check if email already exists
            existing_email = db.table('users').select('*').eq('email', email).execute()
            if existing_email.data:
                return jsonify({'error': 'Email sudah digunakan'}), 400
            
            # Create user
            hashed_password = hash_password(password)
            user_data = {
                'full_name': full_name,
                'username': username,
                'email': email,
                'password': hashed_password,
                'created_at': datetime.now().isoformat()
            }
            
            result = db.table('users').insert(user_data).execute()
            
            if result.data:
                return jsonify({'success': True, 'message': 'Akun berhasil dibuat! Silakan login.'})
            else:
                return jsonify({'error': 'Gagal membuat akun'}), 500
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/history')
@require_login
def history():
    return render_template('history.html', username=session.get('username'))

@app.route('/setup')
@require_login
def setup():
    return render_template('setup.html', username=session.get('username'))

@app.route('/api/receipts', methods=['GET', 'POST'])
@require_login
def receipts_api():
    """Handle GET and POST requests for receipts"""
    if request.method == 'GET':
        """Get all receipts or filter by company"""
        try:
            db = get_supabase()
            if not db:
                return jsonify({'error': 'Database not configured'}), 500

            # Check if company filter is requested
            company = request.args.get('company')

            if company:
                # Filter by company code
                response = db.table('receipts').select('*').eq('company_code', company).order('created_at', desc=True).execute()
            else:
                # Get all receipts
                response = db.table('receipts').select('*').order('created_at', desc=True).execute()

            receipts = response.data if response.data else []
            
            return jsonify({
                'receipts': receipts,
                'total': len(receipts)
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        """Create new receipt"""
        try:
            db = get_supabase()
            if not db:
                return jsonify({'error': 'Database not configured'}), 500

            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['receipt_number', 'company_code', 'company_name', 'date', 'recipient', 'address', 'total_amount']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'Field {field} is required'}), 400

            # Insert receipt
            receipt_data = {
                'receipt_number': data['receipt_number'],
                'company_code': data['company_code'],
                'company_name': data['company_name'],
                'date': data['date'],
                'recipient': data['recipient'],
                'address': data['address'],
                'total_amount': data['total_amount'],
                'created_at': datetime.now().isoformat()
            }

            receipt_response = db.table('receipts').insert(receipt_data).execute()
            
            if not receipt_response.data:
                return jsonify({'error': 'Failed to create receipt'}), 500

            receipt_id = receipt_response.data[0]['id']

            # Insert items
            if data.get('items') and isinstance(data['items'], list):
                for item in data['items']:
                    item_data = {
                        'receipt_id': receipt_id,
                        'quantity': item.get('quantity'),
                        'item_type': item.get('item_type'),
                        'size': item.get('size'),
                        'color': item.get('color'),
                        'unit_price': item.get('unit_price'),
                        'total_price': item.get('total_price'),
                        'created_at': datetime.now().isoformat()
                    }
                    db.table('items').insert(item_data).execute()

            return jsonify({
                'success': True,
                'message': 'Receipt created successfully',
                'receipt_id': receipt_id
            })

        except Exception as e:
            print(f"Error creating receipt: {e}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/receipts/<int:receipt_id>', methods=['GET'])
@require_login
def get_receipt(receipt_id):
    """Get a specific receipt with items"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500

        # Get receipt
        receipt_response = db.table('receipts').select('*').eq('id', receipt_id).execute()
        if not receipt_response.data:
            return jsonify({'error': 'Receipt not found'}), 404

        receipt = receipt_response.data[0]

        # Get items for this receipt
        items_response = db.table('items').select('*').eq('receipt_id', receipt_id).execute()
        items = items_response.data if items_response.data else []

        receipt['items'] = items

        return jsonify({
            'receipt': receipt
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/receipts/<int:receipt_id>/pdf', methods=['GET'])
@require_login
def generate_pdf(receipt_id):
    """Generate PDF for a receipt"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500

        # Get receipt with items
        receipt_response = db.table('receipts').select('*').eq('id', receipt_id).execute()
        if not receipt_response.data:
            return jsonify({'error': 'Receipt not found'}), 404

        receipt = receipt_response.data[0]

        # Get items
        items_response = db.table('items').select('*').eq('receipt_id', receipt_id).execute()
        items = items_response.data if items_response.data else []

        # Get current user info
        current_user = session.get('username', 'Unknown')
        current_time = datetime.now().strftime('%d/%m/%Y %H:%M')

        # Generate PDF
        pdf_buffer = generate_receipt_pdf(receipt, items, current_user, current_time)
        pdf_buffer.seek(0)

        # Generate filename
        filename = f"nota_{receipt['receipt_number']}.pdf"

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_receipt_pdf(receipt, items, username, timestamp):
    """Generate PDF content for a receipt with 2 copies on 1 A4 page (like Excel template)"""
    buffer = io.BytesIO()
    
    # Create canvas for single A4 page
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Company-specific styling
    company_code = receipt['company_code']
    is_ppn_company = company_code == 'CH'  # Only CH has PPN
    company_name = receipt['company_name']
    total_amount = receipt['total_amount']
    
    # Function to add receipt content at specific Y position
    def add_receipt_content(start_y, page_type=""):
        # Add logo for Compagre company (CP) at the top
        if company_code == 'CP':
            try:
                # Add logo at the top center of each receipt
                logo_path = "NotaPerusahaan_Web/static/images/logo compagre.JPG"
                if os.path.exists(logo_path):
                    # Draw logo at top center, above company name
                    logo_width = 80  # Logo width in points
                    logo_height = 60  # Logo height in points
                    logo_x = (width - logo_width) / 2  # Center horizontally
                    logo_y = start_y + 20  # Above company name
                    
                    c.drawImage(logo_path, logo_x, logo_y, logo_width, logo_height)
                    
                    # Move company name down to make room for logo
                    company_y = start_y - 20
                else:
                    company_y = start_y
            except Exception as e:
                print(f"Error adding logo: {e}")
                company_y = start_y
        else:
            company_y = start_y
        
        # Add company name (larger font for better readability)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, company_y, company_name)
        
        # Add receipt header
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, company_y - 25, f"NOTA: {receipt['receipt_number']}")
        c.setFont("Helvetica", 10)
        c.drawString(50, company_y - 45, f"Tanggal: {receipt['date']}")
        c.drawString(50, company_y - 65, f"Kepada Yth: {receipt['recipient']}")
        
        # Add address (with word wrapping)
        address = receipt.get('address', '')
        address_lines = []
        if address:
            # Split address into lines if too long
            words = address.split()
            current_line = ""
            
            for word in words:
                if len(current_line + word) < 60:  # Max characters per line
                    current_line += word + " "
                else:
                    if current_line:
                        address_lines.append(current_line.strip())
                    current_line = word + " "
            
            if current_line:
                address_lines.append(current_line.strip())
            
            # Draw address lines
            y_pos = company_y - 85
            for line in address_lines:
                c.drawString(50, y_pos, f"Alamat: {line}")
                y_pos -= 15
        
        # Add items table (better spacing) - adjust for address
        y_position = company_y - 90 - (len(address_lines) * 15)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y_position, "No")
        c.drawString(80, y_position, "Jenis Barang")
        c.drawString(180, y_position, "Ukuran")
        c.drawString(250, y_position, "Warna")
        c.drawString(300, y_position, "Qty")
        c.drawString(350, y_position, "Harga Satuan")
        c.drawString(450, y_position, "Total")
        
        y_position -= 20
        c.setFont("Helvetica", 8)
        if items:
            for i, item in enumerate(items, 1):
                c.drawString(50, y_position, str(i))
                c.drawString(80, y_position, str(item['item_type'])[:20])  # Allow longer names
                c.drawString(180, y_position, str(item['size'])[:15])
                c.drawString(250, y_position, str(item['color'])[:15])
                c.drawString(300, y_position, str(item['quantity']))
                c.drawString(350, y_position, f"Rp {item['unit_price']:,.0f}")
                c.drawString(450, y_position, f"Rp {item['total_price']:,.0f}")
                y_position -= 18
        
        # Add totals (better formatting)
        y_position -= 20
        c.setFont("Helvetica-Bold", 10)
        if is_ppn_company:
            subtotal = total_amount / 1.11
            ppn = total_amount - subtotal
            c.drawString(350, y_position, f"Total Sebelum PPN: Rp {subtotal:,.0f}")
            y_position -= 20
            c.drawString(350, y_position, f"PPN (11%): Rp {ppn:,.0f}")
            y_position -= 20
            c.drawString(350, y_position, f"Total + PPN: Rp {total_amount:,.0f}")
        else:
            c.drawString(350, y_position, f"Total: Rp {total_amount:,.0f}")
        
        # Add signature (better spacing)
        y_position -= 30
        c.setFont("Helvetica", 10)
        c.drawString(50, y_position, "Hormat Kami,")
        y_position -= 25
        c.drawString(50, y_position, "_________________")
        
        # Add "Printed By" watermark (small but readable)
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.grey)
        c.drawString(50, company_y - 250, f"Printed By: {username} | {timestamp}")
    
    # Calculate positions for 2 receipts on 1 A4 page (like Excel template)
    receipt_height = 280  # Height needed for each receipt (more space)
    margin_top = 40
    spacing = 30  # Space between receipts
    
    # Receipt 1: Original (top half)
    add_receipt_content(height - margin_top, "ORIGINAL")
    
    # Receipt 2: Copy (bottom half) - with red watermark
    copy_y = height - margin_top - receipt_height - spacing
    # Add red watermark
    c.setFont("Helvetica-Bold", 60)
    c.setFillColor(colors.red)
    c.setFillAlpha(0.1)  # Slightly more visible
    c.drawCentredString(width/2, copy_y - 120, "COPY")
    c.setFillAlpha(1.0)  # Reset transparency
    c.setFillColor(colors.black)
    add_receipt_content(copy_y, "COPY")
    
    c.save()
    buffer.seek(0)
    
    return buffer

@app.route('/api/stats', methods=['GET'])
@require_login
def get_stats():
    """Get database statistics"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500

        # Get receipts count
        receipts_response = db.table('receipts').select('*', count='exact').execute()
        receipts_count = receipts_response.count if receipts_response.count else 0

        # Get items count
        items_response = db.table('items').select('*', count='exact').execute()
        items_count = items_response.count if items_response.count else 0

        # Export threshold
        export_threshold = app.config.get('EXPORT_THRESHOLD', 1000)
        approaching_limit = receipts_count >= (export_threshold * 0.8)

        return jsonify({
            'receipts_count': receipts_count,
            'items_count': items_count,
            'export_threshold': export_threshold,
            'approaching_limit': approaching_limit
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export', methods=['POST'])
@require_login
def export_data():
    """Export data to Excel and reset database"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500

        # Get all receipts with items
        receipts_response = db.table('receipts').select('*').execute()
        receipts = receipts_response.data if receipts_response.data else []

        items_response = db.table('items').select('*').execute()
        items = items_response.data if items_response.data else []

        if not receipts:
            return jsonify({'error': 'No data to export'}), 400

        # Create Excel file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"nota_export_{timestamp}.xlsx"
        
        # Create DataFrame
        df_receipts = pd.DataFrame(receipts)
        df_items = pd.DataFrame(items)
        
        # Save to Excel
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df_receipts.to_excel(writer, sheet_name='Receipts', index=False)
            df_items.to_excel(writer, sheet_name='Items', index=False)

        # Delete all data from database
        if items:
            db.table('items').delete().neq('id', 0).execute()
        
        if receipts:
            db.table('receipts').delete().neq('id', 0).execute()

        # Clean up file
        os.remove(filename)

        return jsonify({
            'message': f'Data berhasil diexport dan database direset! Total {len(receipts)} nota dan {len(items)} item.',
            'filename': filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
