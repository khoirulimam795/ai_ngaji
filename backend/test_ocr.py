import pytesseract
from pdf2image import convert_from_path
from pathlib import Path

# Path ke PDF yang mau dites (GANTI dengan file PDF scan kamu)
pdf_path = Path(r"C:\Users\khoir\Downloads\Ilmu_Tajwid_Lengkap(1).pdf")

if not pdf_path.exists():
    print("❌ File PDF tidak ditemukan!")
    print("💡 Ganti path di baris 6 dengan file PDF scan kamu")
    exit()

print("🔄 Mengkonversi PDF ke gambar...")
try:
    # Konversi halaman pertama PDF ke gambar
    images = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=300)
    print(f"✅ Berhasil konversi! Jumlah halaman: {len(images)}")
except Exception as e:
    print(f"❌ Gagal konversi PDF: {e}")
    print("💡 Cek apakah Poppler sudah di PATH dengan: pdftoppm -h")
    exit()

print("\n🔄 Melakukan OCR dengan bahasa Arab...")
try:
    # Ekstrak teks dengan bahasa Arab + English
    text = pytesseract.image_to_string(images[0], lang='ara+eng')
    print("✅ OCR berhasil!")
    print("\n" + "="*50)
    print("HASIL TEKS:")
    print("="*50)
    print(text)
    print("="*50)
    
    if not text.strip():
        print("\n⚠️ Teks kosong! Mungkin:")
        print("  1. PDF adalah gambar kosong")
        print("  2. Arabic language pack belum terinstall")
        print("  3. Kualitas gambar terlalu buruk")
except Exception as e:
    print(f"❌ Gagal OCR: {e}")
    print("💡 Cek apakah Arabic language pack sudah di tessdata")