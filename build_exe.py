import PyInstaller.__main__
import os

# Build the executable
PyInstaller.__main__.run([
    'main.py',
    '--onefile',
    '--windowed',
    '--name=SistemNotaPerusahaan',
    '--icon=icon.ico',  # Optional: add icon if available
    '--add-data=requirements.txt;.',
    '--hidden-import=tkinter',
    '--hidden-import=tkcalendar',
    '--hidden-import=reportlab',
    '--hidden-import=sqlite3',
    '--hidden-import=datetime',
    '--hidden-import=os',
    '--hidden-import=sys',
    '--hidden-import=webbrowser'
])

print("Executable berhasil dibuat di folder dist/")
