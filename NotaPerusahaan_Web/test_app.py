from flask import Flask, render_template, request, jsonify

app = Flask(__name__, static_folder='static', static_url_path='/static')

@app.route('/')
def index():
    return "Hello World! Aplikasi Nota Perusahaan berjalan!"

@app.route('/test')
def test():
    return jsonify({"status": "success", "message": "API berfungsi!"})

if __name__ == "__main__":
    app.run(debug=True)
