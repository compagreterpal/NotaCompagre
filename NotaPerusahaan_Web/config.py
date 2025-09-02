import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('.env.txt')  # Gunakan .env.txt agar tidak diblokir Windows

class Config:
    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Database Configuration
    DATABASE_NAME = 'nota_perusahaan'
    
    # Company Codes
    COMPANIES = {
        'CH': 'PT. CHASTE GEMILANG MANDIRI',
        'CR': 'PT CREATIVE GLOBAL MULIA', 
        'CP': 'CV. COMPAGRE'
    }
    
    # Receipt Settings
    MAX_RECEIPTS_PER_PAGE = 50
    EXPORT_THRESHOLD = 1000  # Export when database reaches this many records
