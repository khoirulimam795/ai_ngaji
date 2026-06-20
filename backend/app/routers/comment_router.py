import sqlite3
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
from src.user_data import DB_PATH

router = APIRouter(prefix="/session", tags=["Sistem Komentar"])

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class CommentRequest(BaseModel):
    class_code: str
    comment_text: str

@router.post("/{session_id}/comment")
async def add_comment(
    session_id: int, 
    req: CommentRequest, 
    x_teacher_id: str = Header(None)
):
    conn = get_db()
    cursor = conn.cursor()

    # 1. Validasi: Apakah guru ini owner dari kelas tersebut?
    cursor.execute("SELECT teacher_id FROM classes WHERE class_code = ?", (req.class_code,))
    cls = cursor.fetchone()
    if not cls or cls["teacher_id"] != x_teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Kamu bukan guru kelas ini.")

    # 2. Validasi: Ambil data sesi, lalu cek apakah siswa pemilik sesi ini adalah member kelas
    cursor.execute("SELECT id, user_id FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")

    # Cek apakah user_id dari sesi ini ada di class_members kelas tersebut
    cursor.execute("""
        SELECT 1 FROM class_members 
        WHERE class_code = ? AND user_id = ? AND left_at IS NULL
    """, (req.class_code, session["user_id"]))
    
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Siswa ini bukan anggota kelas kamu.")

    # 3. 🔥 UPDATE KOMENTAR (Bisa untuk kirim baru ATAU ubah komentar lama)
    # comment_read_at di-set NULL agar siswa mendapat notifikasi ulang bahwa ada komentar baru/berubah
    cursor.execute("""
        UPDATE sessions 
        SET teacher_comment = ?, comment_sent_by = ?, comment_read_at = NULL 
        WHERE id = ?
    """, (req.comment_text, x_teacher_id, session_id))
    
    conn.commit()
    conn.close()

    return {"success": True, "message": "Komentar berhasil dikirim/diupdate ke siswa!"}

@router.post("/{session_id}/comment/read")
async def mark_comment_read(session_id: int, x_user_id: str = Header(None)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Update waktu dibaca
    cursor.execute("""
        UPDATE sessions 
        SET comment_read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
    """, (session_id, x_user_id))
    
    conn.commit()
    conn.close()
    
    return {"success": True}