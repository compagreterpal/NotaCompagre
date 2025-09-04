from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello World! Aplikasi Nota Perusahaan berjalan!"

@app.route('/test')
def test():
    return jsonify({"status": "success", "message": "API berfungsi!"})

# Export untuk Vercel
if __name__ == "__main__":
    app.run()