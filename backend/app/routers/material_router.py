import sqlite3
import uuid
import os
import json
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional
import pdfplumber
import pytesseract
import sys
if sys.platform == 'win32':
    poppler_path = r"C:\poppler\Library\bin"
    if poppler_path not in os.environ['PATH']:
        os.environ['PATH'] = poppler_path + os.pathsep + os.environ['PATH']
    
    # Set path Tesseract manual
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

router = APIRouter(prefix="/class", tags=["Materi PDF"])

# 🔥 Import DB_PATH dari user_data agar 100% sinkron
from src.user_data import DB_PATH

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Pastikan folder temp_uploads ada
TEMP_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "temp_uploads"
TEMP_UPLOAD_DIR.mkdir(exist_ok=True)

# ==========================================
# 1. UPLOAD PDF & EKSTRAK TEKS (PREVIEW)
# ==========================================
@router.post("/{code}/material/upload")
async def upload_material(
    code: str,
    file: UploadFile = File(...),
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # 1. Validasi Guru Owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # 2. Validasi File
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        conn.close()
        raise HTTPException(status_code=400, detail="File harus berformat PDF.")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024: # Max 10MB
        conn.close()
        raise HTTPException(status_code=413, detail="Ukuran file maksimal 10MB.")

    # 3. Simpan file sementara
    upload_id = str(uuid.uuid4())
    temp_path = TEMP_UPLOAD_DIR / f"{upload_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(content)

    # 4. Ekstraksi Teks
    # 4. Ekstraksi Teks dengan pdfplumber (PDF Digital)
    extracted_text = ""
    parse_method = "manual"

    try:
        import pdfplumber
        with pdfplumber.open(temp_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        if extracted_text.strip():
            parse_method = "digital"
            print(f"✅ PDF digital berhasil diekstrak ({len(extracted_text)} karakter)")
    except Exception as e:
        print(f"⚠️ pdfplumber gagal: {e}")

    # 🔥 FALLBACK: Jika pdfplumber gagal/hasil kosong, coba OCR untuk PDF Scan
    if not extracted_text.strip() or len(extracted_text.strip()) < 50:
        print("🔄 Mencoba OCR untuk PDF scan...")
        try:
            from pdf2image import convert_from_path
            import pytesseract
            
            # Konversi PDF ke gambar (maksimal 3 halaman pertama)
            images = convert_from_path(
                temp_path, 
                first_page=1, 
                last_page=min(3, 10),  # Batasi 3 halaman
                dpi=300  # Resolusi tinggi untuk akurasi OCR
            )
            
            # Ekstrak teks dari setiap halaman
            for img in images:
                # Gunakan bahasa Arab + English (untuk angka/latin)
                page_text = pytesseract.image_to_string(img, lang='ara+eng')
                extracted_text += page_text + "\n"
            
            if extracted_text.strip():
                parse_method = "ocr"
                print(f"✅ OCR berhasil! ({len(extracted_text)} karakter)")
            else:
                print("⚠️ OCR tidak menghasilkan teks")
                
        except ImportError as e:
            print(f"❌ Library tidak terinstall: {e}")
            print("💡 Jalankan: pip install pdf2image pytesseract Pillow")
        except Exception as e:
            print(f"❌ OCR gagal: {e}")
            print("💡 Pastikan Poppler sudah di PATH dan Arabic language pack ada di tessdata")

    # Parse teks untuk preview card
    lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]

    card_preview = {
        "title": lines[0] if lines else file.filename.replace('.pdf', '').replace('_', ' ').title(),
        "description": " ".join(lines[1:4]) if len(lines) > 1 else "",
        "example_arab": "",
        "tips": []
    }

# Return response
    return {
        "success": True,
        "upload_id": upload_id,
        "parse_method": parse_method,  # "digital", "ocr", atau "manual"
        "card_preview": card_preview,
        "source_filename": file.filename,
        "full_text": extracted_text[:1000]  # Preview 1000 karakter
    }

# ==========================================
# 2. PUBLISH CARD MATERI KE DATABASE
# ==========================================
class PublishMaterialRequest(BaseModel):
    upload_id: str
    title: str
    description: str
    example_arab: str = ""
    tips: List[str] = []
    source_filename: str = ""

@router.post("/{code}/material/publish")
async def publish_material(
    code: str,
    req: PublishMaterialRequest,
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # 1. Validasi Guru Owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # 2. Cek Limit Materi (Maks 20 per kelas)
    cursor.execute("SELECT COUNT(*) FROM teacher_materials WHERE class_code = ? AND is_active = 1", (code,))
    count = cursor.fetchone()[0]
    if count >= 20:
        conn.close()
        raise HTTPException(status_code=400, detail="Kamu sudah punya 20 materi. Hapus yang lama dulu ya.")

    # 3. Simpan ke Database
    material_id = str(uuid.uuid4())
    tips_json = json.dumps(req.tips, ensure_ascii=False)
    
    cursor.execute("""
        INSERT INTO teacher_materials (id, class_code, title, description, example_arab, tips, source_filename, parse_method, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'digital', 1)
    """, (material_id, code, req.title, req.description, req.example_arab, tips_json, req.source_filename))
    
    conn.commit()
    conn.close()

    # 4. Hapus file temp
    temp_path = TEMP_UPLOAD_DIR / f"{req.upload_id}.pdf"
    if temp_path.exists():
        os.remove(temp_path)

    return {
        "success": True,
        "material_id": material_id,
        "message": "Materi berhasil dikirim ke siswa kelas kamu!"
    }

# ==========================================
# 3. AMBIL MATERI (UNTUK SISWA)
# ==========================================
@router.get("/{code}/materials")
async def get_class_materials(code: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, description, example_arab, tips, source_filename, created_at
        FROM teacher_materials
        WHERE class_code = ? AND is_active = 1
        ORDER BY created_at DESC
    """, (code,))
    
    materials = []
    for row in cursor.fetchall():
        mat = dict(row)
        try:
            mat["tips"] = json.loads(mat["tips"]) if mat["tips"] else []
        except:
            mat["tips"] = []
        materials.append(mat)

    conn.close()
    
    return {
        "class_code": code,
        "materials": materials
    }

# ==========================================
# 4. AMBIL SEMUA MATERI GURU (UNTUK MANAGE)
# ==========================================
@router.get("/{code}/materials/manage")
async def get_teacher_materials(
    code: str,
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # Validasi owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    cursor.execute("""
        SELECT id, title, description, example_arab, tips, source_filename, 
            created_at, is_active
        FROM teacher_materials
        WHERE class_code = ?
        ORDER BY created_at DESC
    """, (code,))
    
    materials = []
    for row in cursor.fetchall():
        mat = dict(row)
        try:
            mat["tips"] = json.loads(mat["tips"]) if mat["tips"] else []
        except:
            mat["tips"] = []
        materials.append(mat)

    conn.close()
    
    return {
        "class_code": code,
        "materials": materials
    }

# ==========================================
# 5. UPDATE MATERI
# ==========================================
class UpdateMaterialRequest(BaseModel):
    title: str
    description: str
    example_arab: str = ""
    tips: List[str] = []

@router.put("/{code}/material/{material_id}")
async def update_material(
    code: str,
    material_id: str,
    req: UpdateMaterialRequest,
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # Validasi owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    tips_json = json.dumps(req.tips, ensure_ascii=False)
    
    cursor.execute("""
        UPDATE teacher_materials 
        SET title = ?, description = ?, example_arab = ?, tips = ?
        WHERE id = ? AND class_code = ?
    """, (req.title, req.description, req.example_arab, tips_json, material_id, code))
    
    conn.commit()
    conn.close()

    return {"success": True, "message": "Materi berhasil diupdate."}

# ==========================================
# 6. DELETE MATERI (SOFT DELETE)
# ==========================================
@router.delete("/{code}/material/{material_id}")
async def delete_material(
    code: str,
    material_id: str,
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # Validasi owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # Soft delete (set is_active = 0)
    cursor.execute("""
        UPDATE teacher_materials 
        SET is_active = 0
        WHERE id = ? AND class_code = ?
    """, (material_id, code))
    
    conn.commit()
    conn.close()

    return {"success": True, "message": "Materi berhasil dihapus."}