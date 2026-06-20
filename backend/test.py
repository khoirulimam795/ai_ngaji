import sqlite3
import uuid
import string
import random
from pathlib import Path

# Path ke database utama
DB_PATH = Path(__file__).parent / "data" / "users.db"

def generate_code():
    chars = string.ascii_uppercase + string.digits
    return f"{''.join(random.choices(chars, k=2))}-{''.join(random.choices(chars, k=4))}"

def create_dummy_classes():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🎯 Membuat 3 Kelas Dummy untuk Testing Siswa...")
    
    classes_data = [
        ("Kelas TPQ Al-Hidayah", "teacher_dummy_1"),
        ("Kelas Ngaji Minggu Pagi", "teacher_dummy_2"),
        ("Kelas Privat Ustadz Farhan", "teacher_dummy_3")
    ]
    
    generated_codes = []
    
    for name, tid in classes_data:
        code = generate_code()
        class_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO classes (id, class_code, class_name, teacher_id)
            VALUES (?, ?, ?, ?)
        """, (class_id, code, name, tid))
        
        generated_codes.append((name, code))
        print(f"✅ {name} -> Kode: {code}")
        
    conn.commit()
    conn.close()
    
    print("\n🎉 Selesai! Silakan copy kode di atas untuk dites di sisi Siswa.")

if __name__ == "__main__":
    create_dummy_classes()