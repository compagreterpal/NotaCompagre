from app import app

# Handler untuk Vercel
def handler(request):
    return app(request.environ, lambda *args: None)

if __name__ == "__main__":
    app.run()
