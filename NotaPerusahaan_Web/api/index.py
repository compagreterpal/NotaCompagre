from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello World! Aplikasi Nota Perusahaan berjalan!"

@app.route('/test')
def test():
    return {"status": "success", "message": "API berfungsi!"}

def handler(request):
    return app(request.environ, lambda *args: None)