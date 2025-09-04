import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

def handler(request):
    return app(request.environ, lambda *args: None)