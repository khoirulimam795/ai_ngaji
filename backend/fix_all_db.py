import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "users.db"

def fix():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Cek apakah ada unique constraint pada teacher_id
    cursor.execute("PRAGMA index_list(classes)")
    indexes = cursor.fetchall()
    
    for idx in indexes:
        cursor.execute(f"PRAGMA index_info({idx[1]})")
        columns = cursor.fetchall()
        col_names = [c[2] for c in columns]
        if 'teacher_id' in col_names and 'unique' in str(idx[2]).lower():
            cursor.execute(f"DROP INDEX {idx[1]}")
            print(f"✅ Menghapus unique constraint: {idx[1]}")
    
    conn.commit()
    conn.close()
    print("🎉 Database siap untuk multi-class guru!")

if __name__ == "__main__":
    fix()