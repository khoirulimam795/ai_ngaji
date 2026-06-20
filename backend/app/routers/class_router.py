import sqlite3
import uuid
import string
import random
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from pathlib import Path
from src.user_data import DB_PATH
import json

router = APIRouter(prefix="/class", tags=["Portal Guru"])

# Path ke database (sesuaikan dengan struktur project)
# Mundur 3 level dari routers -> app -> backend, lalu masuk ke folder data


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # <-- PENTING: Agar bisa akses kolom pakai nama (cls["class_name"])
    return conn

def generate_class_code() -> str:
    """Generate kode kelas unik format XX-XXXX (misal: 3A-X7K2)"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(random.choices(chars, k=2))
    part2 = ''.join(random.choices(chars, k=4))
    return f"{part1}-{part2}"

class CreateClassRequest(BaseModel):
    teacher_id: str
    class_name: str

class JoinClassRequest(BaseModel):
    user_id: str
    display_name: str = "Siswa"
@router.post("/create")
async def create_class(req: CreateClassRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # 🔥 HAPUS VALIDASI INI:
    # cursor.execute("SELECT class_code FROM classes WHERE teacher_id = ?", (req.teacher_id,))
    # existing = cursor.fetchone()
    # if existing:
    #     conn.close()
    #     raise HTTPException(status_code=400, detail="Kamu sudah punya kelas aktif.")
    
    # Generate kode unik
    while True:
        code = generate_class_code()
        cursor.execute("SELECT id FROM classes WHERE class_code = ?", (code,))
        if not cursor.fetchone():
            break
            
    class_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO classes (id, class_code, class_name, teacher_id)
        VALUES (?, ?, ?, ?)
    """, (class_id, code, req.class_name, req.teacher_id))
    
    conn.commit()
    conn.close()
    
    return {
        "class_code": code,
        "class_name": req.class_name,
        "teacher_id": req.teacher_id
    }

@router.get("/{code}")
async def get_class_info(code: str):
    conn = get_db()
    cursor = conn.cursor()
    
    # FIX: Pastikan mengambil class_name
    cursor.execute("""
        SELECT class_code, class_name, teacher_id, 
               (SELECT COUNT(*) FROM class_members WHERE class_code = ? AND left_at IS NULL) as member_count
        FROM classes 
        WHERE class_code = ?
    """, (code, code))
    
    cls = cursor.fetchone()
    conn.close()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Kode kelas tidak ditemukan.")
        
    return {
        "class_code": cls["class_code"],
        "class_name": cls["class_name"],
        "member_count": cls["member_count"]
    }

@router.post("/{code}/join")
async def join_class(code: str, req: JoinClassRequest, x_user_id: str = Header(None)):
    user_id = x_user_id or req.user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id diperlukan")
        
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Cek apakah kelas ada
    cursor.execute("SELECT class_name FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls:
        conn.close()
        raise HTTPException(status_code=404, detail="Kode kelas tidak ditemukan.")
        
    # 2. 🔥 PERBAIKAN: Cek status keanggotaan siswa
    cursor.execute("""
        SELECT joined_at, left_at 
        FROM class_members 
        WHERE class_code = ? AND user_id = ?
    """, (code, user_id))
    
    existing_member = cursor.fetchone()

    if existing_member:
        # Jika sudah ada datanya
        if existing_member["left_at"] is None:
            # Kasus A: Masih aktif di kelas (belum keluar)
            conn.close()
            return {"success": True, "message": "Kamu sudah bergabung ke kelas ini.", "class_name": cls["class_name"]}
        else:
            # Kasus B: Pernah join tapi sudah keluar -> RE-ACTIVATE (UPDATE)
            cursor.execute("""
                UPDATE class_members 
                SET left_at = NULL, display_name = ?
                WHERE class_code = ? AND user_id = ?
            """, (req.display_name, code, user_id))
            conn.commit()
            conn.close()
            return {"success": True, "message": "Berhasil bergabung kembali ke kelas!", "class_name": cls["class_name"]}
    else:
        # Kasus C: Belum pernah join sama sekali -> INSERT BARU
        cursor.execute("""
            INSERT INTO class_members (class_code, user_id, display_name)
            VALUES (?, ?, ?)
        """, (code, user_id, req.display_name))
        conn.commit()
        conn.close()
        return {"success": True, "class_name": cls["class_name"], "message": "Berhasil bergabung ke kelas!"}

@router.get("/{code}/students")
async def get_class_students(code: str, x_teacher_id: str = Header(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT class_name, teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    
    if not cls:
        conn.close()
        raise HTTPException(status_code=404, detail="Kode kelas tidak ditemukan.")
        
    # 🔥 AUTO-RECLAIM: Jika teacher_id tidak cocok, update database agar cocok dengan yang sekarang
    # Ini sesuai PRD: "acceptable risk di v1" karena tidak ada sistem login/password
    if cls["teacher_id"] != x_teacher_id:
        print(f"⚠️ Teacher ID mismatch untuk kelas {code}. Melakukan auto-reclaim ke {x_teacher_id}...")
        cursor.execute("UPDATE classes SET teacher_id = ? WHERE class_code = ?", (x_teacher_id, code))
        conn.commit()
        # Update juga variabel cls agar return value di bawah tidak error
        cls = {"class_name": cls["class_name"], "teacher_id": x_teacher_id}

    # Query kompleks untuk ambil stats per siswa
    cursor.execute("""
        SELECT 
            cm.user_id,
            cm.display_name,
            COUNT(s.id) AS total_sessions,
            ROUND(AVG(s.accuracy), 1) AS avg_score,
            MAX(s.created_at) AS last_session_at,
            (SELECT surah_name FROM sessions WHERE user_id = cm.user_id ORDER BY created_at DESC LIMIT 1) AS last_surah,
            SUM(CASE WHEN s.teacher_comment IS NOT NULL AND s.comment_read_at IS NULL THEN 1 ELSE 0 END) AS unread_comments
        FROM class_members cm
        LEFT JOIN sessions s ON s.user_id = cm.user_id
        WHERE cm.class_code = ? AND cm.left_at IS NULL
        GROUP BY cm.user_id
        ORDER BY last_session_at DESC
    """, (code,))
    
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "class_code": code,
        "class_name": cls["class_name"],
        "students": students
    }

@router.get("/{code}/student/{user_id}/sessions")
async def get_student_sessions(code: str, user_id: str, x_teacher_id: str = Header(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Validasi owner kelas
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # 2. Ambil nama siswa dari class_members
    cursor.execute("""
        SELECT display_name 
        FROM class_members 
        WHERE class_code = ? AND user_id = ? AND left_at IS NULL
    """, (code, user_id))
    
    member = cursor.fetchone()
    student_name = member["display_name"] if member and member["display_name"] else f"Siswa #{user_id[-4:].upper()}"

    # 3. 🔥 FIX: Ambil SEMUA sesi siswa (tanpa filter tanggal join) + errors_json
    cursor.execute("""
        SELECT id, surah_name, accuracy, correct_count, wrong_count, created_at,
               teacher_comment, comment_read_at, comment_sent_by, errors_json
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    """, (user_id,))
    
    sessions = []
    for row in cursor.fetchall():
        session = dict(row)
        # Parse errors_json menjadi object Python
        if session.get("errors_json"):
            try:
                session["errors"] = json.loads(session["errors_json"])
            except:
                session["errors"] = []
        else:
            session["errors"] = []
        
        # Hapus errors_json mentah agar response lebih bersih
        if "errors_json" in session:
            del session["errors_json"]
            
        sessions.append(session)
        
    conn.close()
    
    # Return student_name agar frontend bisa pakai untuk komentar
    return {"user_id": user_id, "class_code": code, "student_name": student_name, "sessions": sessions}

@router.post("/{code}/leave")
async def leave_class(code: str, x_user_id: str = Header(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Soft delete: Tandai left_at dengan waktu sekarang
    cursor.execute("""
        UPDATE class_members 
        SET left_at = CURRENT_TIMESTAMP 
        WHERE class_code = ? AND user_id = ? AND left_at IS NULL
    """, (code, x_user_id))
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Berhasil keluar dari kelas."}

# ==========================================
# ENDPOINT BARU: DETAIL LENGKAP SISWA (UNTUK LAPORAN PDF)
# ==========================================
@router.get("/{code}/student/{user_id}/full")
async def get_student_full_detail(code: str, user_id: str, x_teacher_id: str = Header(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Validasi owner
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # Ambil info siswa
    cursor.execute("""
        SELECT display_name, joined_at 
        FROM class_members 
        WHERE class_code = ? AND user_id = ? AND left_at IS NULL
    """, (code, user_id))
    member = cursor.fetchone()
    
    if not member:
        conn.close()
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")

    # Ambil semua sesi + komentar
    cursor.execute("""
        SELECT id, surah_name, accuracy, correct_count, wrong_count, created_at,
               teacher_comment, comment_read_at, comment_sent_by
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    sessions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "user_id": user_id,
        "display_name": member["display_name"],
        "joined_at": member["joined_at"],
        "total_sessions": len(sessions),
        "sessions": sessions
    }