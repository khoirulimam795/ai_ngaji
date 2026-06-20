import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict

# 🔥 FIX: Gunakan path absolut agar SELALU menunjuk ke backend/data/users.db
# Tidak peduli dari folder mana kamu menjalankan python
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
def init_db():
    """Inisialisasi database SQLite dan pastikan kolom v2.0 ada"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Buat tabel dasar jika benar-benar baru (tanpa kolom v2.0 dulu agar tidak bentrok)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            surah INTEGER NOT NULL,
            surah_name TEXT,
            accuracy REAL NOT NULL,
            correct_count INTEGER,
            wrong_count INTEGER,
            errors_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Tambahkan kolom v2.0 secara AMAN jika belum ada
    columns_to_add = [
        ("class_code", "TEXT DEFAULT NULL"),
        ("teacher_comment", "TEXT DEFAULT NULL"),
        ("comment_read_at", "DATETIME DEFAULT NULL"),
        ("comment_sent_by", "TEXT DEFAULT NULL")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            # Trik SQLite: coba select kolom. Jika error, berarti kolom belum ada
            conn.execute(f"SELECT {col_name} FROM sessions LIMIT 1")
        except sqlite3.OperationalError:
            # Jika error, tambahkan kolom tersebut
            conn.execute(f"ALTER TABLE sessions ADD COLUMN {col_name} {col_type}")
            print(f"✅ Kolom '{col_name}' berhasil ditambahkan ke tabel sessions.")

    # 3. Buat index (aman dengan IF NOT EXISTS, sekarang kolomnya dijamin sudah ada)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_user_id ON sessions(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON sessions(created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_code)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_comment ON sessions(class_code, teacher_comment, comment_read_at)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS class_members (
            class_code TEXT NOT NULL,
            user_id TEXT NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            left_at DATETIME DEFAULT NULL,
            PRIMARY KEY (class_code, user_id)
        )
    """)
    
    try:
        # Cek apakah kolom display_name sudah ada
        conn.execute("SELECT display_name FROM class_members LIMIT 1")
    except sqlite3.OperationalError:
        # Jika belum ada, tambahkan otomatis
        conn.execute("ALTER TABLE class_members ADD COLUMN display_name TEXT DEFAULT 'Siswa'")
        print("✅ Kolom 'display_name' otomatis ditambahkan ke class_members.")
    conn.commit()
    conn.close()
    print(f"✅ Database siap di: {DB_PATH}")

def save_session(
    user_id: str,
    surah: int,
    surah_name: str,
    accuracy: float,
    correct: int,
    wrong: int,
    errors: List[Dict],
    class_code: str = None  # <-- BARU: Parameter opsional
) -> Dict:
    """Simpan satu sesi ngaji user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    errors_json = json.dumps(errors, ensure_ascii=False)

    cursor.execute("""
        INSERT INTO sessions (user_id, surah, surah_name, accuracy, correct_count, wrong_count, errors_json, class_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, surah, surah_name, accuracy, correct, wrong, errors_json, class_code))

    session_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": session_id,
        "user_id": user_id,
        "surah": surah,
        "surah_name": surah_name,
        "accuracy": accuracy,
        "correct_count": correct,
        "wrong_count": wrong,
        "class_code": class_code,
        "created_at": datetime.now().isoformat()
    }

def get_user_stats(user_id: str) -> Dict:
    """Ambil statistik user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE user_id = ?", (user_id,))
    total_sessions = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(accuracy) FROM sessions WHERE user_id = ?", (user_id,))
    avg_accuracy = cursor.fetchone()[0] or 0

    cursor.execute("SELECT MAX(accuracy) FROM sessions WHERE user_id = ?", (user_id,))
    best_accuracy = cursor.fetchone()[0] or 0

    cursor.execute("SELECT SUM(correct_count), SUM(wrong_count) FROM sessions WHERE user_id = ?", (user_id,))
    total_correct, total_wrong = cursor.fetchone()
    total_correct = total_correct or 0
    total_wrong = total_wrong or 0

    conn.close()

    return {
        "total_sessions": total_sessions,
        "avg_accuracy": round(avg_accuracy, 1),
        "best_accuracy": best_accuracy,
        "total_correct": total_correct,
        "total_wrong": total_wrong,
        "total_checks": total_correct + total_wrong
    }

def get_user_history(user_id: str, limit: int = 100) -> List[Dict]: # <-- Ubah limit default jadi 100
    """Ambil riwayat sesi user (termasuk status komentar dan errors)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, surah, surah_name, accuracy, correct_count, wrong_count, 
               created_at, teacher_comment, comment_read_at, errors_json
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_id, limit))

    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        session = {
            "id": row[0],
            "surah": row[1],
            "surah_name": row[2],
            "accuracy": row[3],
            "correct_count": row[4],
            "wrong_count": row[5],
            "created_at": row[6],
            "teacher_comment": row[7],
            "comment_read_at": row[8]
        }
        # Parse errors_json
        if row[9]:
            try:
                session["errors"] = json.loads(row[9])
            except:
                session["errors"] = []
        else:
            session["errors"] = []
            
        history.append(session)

    return history