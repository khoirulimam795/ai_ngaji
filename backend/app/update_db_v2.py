# backend/app/update_db_v2.py
import sqlite3
import os
from pathlib import Path

# Pastikan path ke database sesuai dengan struktur project (sama dengan user_data.py)
DB_PATH = Path("data/users.db")

def upgrade_database():
    print("🔄 Memulai upgrade database ke v2.0 (Portal Guru)...")
    
    try:
        # Pastikan folder data ada
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Buat tabel classes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                class_code TEXT UNIQUE NOT NULL,
                class_name TEXT NOT NULL,
                teacher_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id)")
        print("✅ Tabel 'classes' siap.")

        # 2. Buat tabel class_members
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS class_members (
                class_code TEXT NOT NULL,
                user_id TEXT NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                left_at DATETIME DEFAULT NULL,
                PRIMARY KEY (class_code, user_id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_user ON class_members(user_id)")
        print("✅ Tabel 'class_members' siap.")

        # 3. Buat tabel teacher_materials
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teacher_materials (
                id TEXT PRIMARY KEY,
                class_code TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                example_arab TEXT,
                tips TEXT,
                source_filename TEXT,
                parse_method TEXT DEFAULT 'manual',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_materials_class ON teacher_materials(class_code)")
        print("✅ Tabel 'teacher_materials' siap.")

        # 4. Tambahkan kolom baru ke tabel sessions (existing)
        columns_to_add = [
            ("class_code", "TEXT DEFAULT NULL"),
            ("teacher_comment", "TEXT DEFAULT NULL"),
            ("comment_read_at", "DATETIME DEFAULT NULL"),
            ("comment_sent_by", "TEXT DEFAULT NULL")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE sessions ADD COLUMN {col_name} {col_type}")
                print(f"✅ Kolom '{col_name}' berhasil ditambahkan ke tabel 'sessions'.")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"⚠️ Kolom '{col_name}' sudah ada, dilewati.")
                else:
                    raise e

        # 5. Buat index untuk performa query komentar & kelas
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_comment ON sessions(class_code, teacher_comment, comment_read_at)")
        print("✅ Index tambahan untuk performa query siap.")

        conn.commit()
        print("\n🎉 Upgrade Database v2.0 BERHASIL! Database siap untuk fitur Portal Guru.")
        
    except Exception as e:
        print(f"\n❌ Gagal upgrade database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade_database()