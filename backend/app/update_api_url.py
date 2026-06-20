"""
update_api_url.py
-----------------
Lokasi: backend/app/update_api_url.py

Kegunaan:
Tiap kali ngrok restart, URL-nya berubah.
Script ini otomatis update URL di frontend lo
biar gak perlu ganti manual tiap kali demo.

Cara pakai:
    cd backend
    python app/update_api_url.py <ngrok_url_baru>

Contoh:
    python app/update_api_url.py https://abc123.ngrok-free.app
"""

import sys
import re
from pathlib import Path

# path ke file api.ts di frontend
API_TS_PATH = Path(__file__).parent.parent.parent / "frontend" / "app" / "src" / "lib" / "api.ts"


def update_api_url(new_url: str):
    if not API_TS_PATH.exists():
        print(f"❌ File tidak ditemukan: {API_TS_PATH}")
        return

    content = API_TS_PATH.read_text(encoding="utf-8")

    # cari pattern BASE_URL atau baseURL atau API_URL
    patterns = [
        r'(const\s+(?:BASE_URL|API_URL|baseURL|apiUrl)\s*=\s*["\'])([^"\']+)(["\'])',
        r'(axios\.defaults\.baseURL\s*=\s*["\'])([^"\']+)(["\'])',
        r'(baseURL:\s*["\'])([^"\']+)(["\'])',
    ]

    updated   = False
    new_content = content

    for pattern in patterns:
        if re.search(pattern, new_content):
            new_content = re.sub(pattern, rf'\g<1>{new_url}\g<3>', new_content)
            updated = True

    if updated:
        API_TS_PATH.write_text(new_content, encoding="utf-8")
        print(f"✅ URL berhasil diupdate ke: {new_url}")
        print(f"   File: {API_TS_PATH}")
        print(f"\n⚠️  Jangan lupa restart frontend:")
        print(f"   cd frontend/app && npm run dev")
    else:
        print(f"⚠️  Gak nemu pattern URL di {API_TS_PATH}")
        print(f"   Update manual di: {API_TS_PATH}")
        print(f"   Ganti BASE_URL jadi: {new_url}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python app/update_api_url.py < https://wand-prowling-overstep.ngrok-free.dev>")
        print("Contoh: python app/update_api_url.py  https://wand-prowling-overstep.ngrok-free.dev")
        sys.exit(1)

    new_url = sys.argv[1].rstrip("/")
    update_api_url(new_url)
