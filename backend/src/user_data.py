# backend/src/user_data.py
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict

DB_PATH = Path("data/users.db")

def init_db():
    """Inisialisasi database SQLite"""
    Path("data").mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
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
    conn.execute("CREATE INDEX IF NOT EXISTS idx_user_id ON sessions(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON sessions(created_at)")
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def save_session(
    user_id: str,
    surah: int,
    surah_name: str,
    accuracy: float,
    correct: int,
    wrong: int,
    errors: List[Dict]
) -> Dict:
    """Simpan satu sesi ngaji user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    errors_json = json.dumps(errors, ensure_ascii=False)
    
    cursor.execute("""
        INSERT INTO sessions (user_id, surah, surah_name, accuracy, correct_count, wrong_count, errors_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, surah, surah_name, accuracy, correct, wrong, errors_json))
    
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
        "created_at": datetime.now().isoformat()
    }

def get_user_stats(user_id: str) -> Dict:
    """Ambil statistik user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total sesi
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE user_id = ?", (user_id,))
    total_sessions = cursor.fetchone()[0]
    
    # Rata-rata akurasi
    cursor.execute("SELECT AVG(accuracy) FROM sessions WHERE user_id = ?", (user_id,))
    avg_accuracy = cursor.fetchone()[0] or 0
    
    # Akurasi tertinggi
    cursor.execute("SELECT MAX(accuracy) FROM sessions WHERE user_id = ?", (user_id,))
    best_accuracy = cursor.fetchone()[0] or 0
    
    # Total benar & salah
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

def get_user_history(user_id: str, limit: int = 10) -> List[Dict]:
    """Ambil riwayat sesi user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, surah, surah_name, accuracy, correct_count, wrong_count, created_at
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row[0],
            "surah": row[1],
            "surah_name": row[2],
            "accuracy": row[3],
            "correct_count": row[4],
            "wrong_count": row[5],
            "created_at": row[6]
        }
        for row in rows
    ]

# Inisialisasi database saat module diimport
init_db()