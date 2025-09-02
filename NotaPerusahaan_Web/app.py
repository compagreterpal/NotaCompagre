from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from supabase import create_client, Client
from datetime import datetime
import json
import os
from config import Config
import pandas as pd
from io import BytesIO
import base64

app = Flask(__name__)
app.config.from_object(Config)

# Initialize Supabase client
supabase: Client = None
if app.config['SUPABASE_URL'] and app.config['SUPABASE_KEY']:
    supabase = create_client(app.config['SUPABASE_URL'], app.config['SUPABASE_KEY'])

def get_supabase():
    """Get Supabase client or return None if not configured"""
    if not supabase:
        return None
    return supabase

@app.route('/')
def index():
    """Main page with receipt form"""
    companies = Config.COMPANIES
    return render_template('index.html', companies=companies)

@app.route('/api/receipts', methods=['GET'])
def get_receipts():
    """Get all receipts from database"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500
        
        response = db.table('receipts').select('*').order('created_at', desc=True).execute()
        receipts = response.data if response.data else []
        
        return jsonify({'receipts': receipts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/receipts', methods=['POST'])
def create_receipt():
    """Create new receipt"""
    try:
        data = request.json
        db = get_supabase()
        
        if not db:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Prepare receipt data
        receipt_data = {
            'receipt_number': data['receipt_number'],
            'company_code': data['company_code'],
            'company_name': data['company_name'],
            'date': data['date'],
            'recipient': data['recipient'],
            'total_amount': data['total_amount'],
            'created_at': datetime.now().isoformat()
        }
        
        # Insert receipt
        receipt_response = db.table('receipts').insert(receipt_data).execute()
        receipt_id = receipt_response.data[0]['id'] if receipt_response.data else None
        
        if not receipt_id:
            return jsonify({'error': 'Failed to create receipt'}), 500
        
        # Insert items
        if data.get('items'):
            items_data = []
            for item in data['items']:
                item_data = {
                    'receipt_id': receipt_id,
                    'quantity': item['quantity'],
                    'item_type': item['item_type'],
                    'size': item.get('size', '-'),
                    'color': item.get('color', '-'),
                    'unit_price': item['unit_price'],
                    'total_price': item['total_price']
                }
                items_data.append(item_data)
            
            if items_data:
                db.table('items').insert(items_data).execute()
        
        return jsonify({'success': True, 'receipt_id': receipt_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/receipts/<int:receipt_id>', methods=['GET'])
def get_receipt(receipt_id):
    """Get specific receipt with items"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Get receipt
        receipt_response = db.table('receipts').select('*').eq('id', receipt_id).execute()
        if not receipt_response.data:
            return jsonify({'error': 'Receipt not found'}), 404
        
        receipt = receipt_response.data[0]
        
        # Get items
        items_response = db.table('items').select('*').eq('receipt_id', receipt_id).execute()
        items = items_response.data if items_response.data else []
        
        receipt['items'] = items
        return jsonify({'receipt': receipt})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export', methods=['POST'])
def export_data():
    """Export data to Excel and reset database"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Get all data
        receipts_response = db.table('receipts').select('*').execute()
        items_response = db.table('items').select('*').execute()
        
        receipts = receipts_response.data if receipts_response.data else []
        items = items_response.data if items_response.data else []
        
        # Create Excel file
        with pd.ExcelWriter('exported_data.xlsx', engine='openpyxl') as writer:
            # Export receipts
            receipts_df = pd.DataFrame(receipts)
            receipts_df.to_excel(writer, sheet_name='Receipts', index=False)
            
            # Export items
            items_df = pd.DataFrame(items)
            items_df.to_excel(writer, sheet_name='Items', index=False)
        
        # Reset database (delete all data)
        db.table('items').delete().neq('id', 0).execute()
        db.table('receipts').delete().neq('id', 0).execute()
        
        return jsonify({
            'success': True, 
            'message': f'Exported {len(receipts)} receipts and {len(items)} items',
            'filename': 'exported_data.xlsx'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        db = get_supabase()
        if not db:
            return jsonify({'error': 'Database not configured'}), 500
        
        # Count receipts
        receipts_count = db.table('receipts').select('id', count='exact').execute()
        receipts_total = receipts_count.count if hasattr(receipts_count, 'count') else 0
        
        # Count items
        items_count = db.table('items').select('id', count='exact').execute()
        items_total = items_count.count if hasattr(items_count, 'count') else 0
        
        # Check if approaching threshold
        approaching_limit = receipts_total >= Config.EXPORT_THRESHOLD * 0.8
        
        return jsonify({
            'receipts_count': receipts_total,
            'items_count': items_total,
            'export_threshold': Config.EXPORT_THRESHOLD,
            'approaching_limit': approaching_limit
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/history')
def history():
    """History page to view all receipts"""
    return render_template('history.html')

@app.route('/setup')
def setup():
    """Setup page for database configuration"""
    return render_template('setup.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
