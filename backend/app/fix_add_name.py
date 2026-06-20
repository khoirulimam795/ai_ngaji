import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "users.db"

def fix_db():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("ALTER TABLE class_members ADD COLUMN display_name TEXT DEFAULT 'Siswa'")
        print("✅ Kolom 'display_name' berhasil ditambahkan ke class_members!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️ Kolom 'display_name' sudah ada, aman!")
        else:
            print(f"❌ Error: {e}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_db()