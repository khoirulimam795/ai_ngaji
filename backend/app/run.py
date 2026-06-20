"""
run.py - Demo Server AI NGAJI
==============================

Script ini otomatis:
1. Build frontend dengan URL ngrok terbaru
2. Serve frontend + backend dari 1 URL
3. Bikin tunnel ngrok biar bisa diakses dari mana aja

Cara pakai:
    cd backend
    python app/run.py

Requirements:
    pip install fastapi uvicorn pyngrok python-multipart
    cd frontend/app && npm install
"""

import sys
import re
import time
import threading
import subprocess
import signal
from pathlib import Path

# Setup paths
BACKEND_DIR = Path(__file__).parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

# ── KONFIGURASI ──────────────────────────────────────────
NGROK_TOKEN = "3EdW1D87mbcQSpwjdjfZlgrHoBR_4eKk3DwRRWLSe65ivZ7ye"  # ← GANTI PUNYA LO
BACKEND_PORT = 8000
# ──────────────────────────────────────────────────────────


def check_deps():
    """Cek semua dependencies sebelum jalan"""
    print("🔍 Cek dependencies...")
    
    errors = []
    
    # Ngrok token
    if not NGROK_TOKEN or NGROK_TOKEN == "udh gw ganti":
        errors.append("NGROK_TOKEN belum diisi di run.py")
    
    # Node.js
    try:
        r = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if r.returncode != 0:
            raise Exception()
        print(f"   ✅ Node.js {r.stdout.strip()}")
    except:
        errors.append("Node.js gak ada. Install: https://nodejs.org/")
    
    # Python packages
    for pkg in ["pyngrok", "uvicorn", "fastapi"]:
        try:
            __import__(pkg)
        except ImportError:
            errors.append(f"Package '{pkg}' gak ada. Install: pip install {pkg}")
    
    if errors:
        print("   ❌ Error:")
        for e in errors:
            print(f"      • {e}")
        sys.exit(1)
    
    print("   ✅ Semua OK")


def build_frontend(api_url: str) -> bool:
    """Update API_BASE dan rebuild frontend kalau perlu"""
    print("\n📦 Prepare frontend...")
    
    files = [
        PROJECT_ROOT / "frontend" / "app" / "src" / "lib" / "api.ts",
        PROJECT_ROOT / "frontend" / "app" / "src" / "hooks" / "useStats.ts",
    ]
    
    need_build = False
    
    for f in files:
        if not f.exists():
            print(f"   ⚠️  Gak ada: {f.name}")
            continue
        
        content = f.read_text(encoding="utf-8")
        
        # Skip kalau URL udah sama
        if f'"{api_url}"' in content or f"'{api_url}'" in content:
            print(f"   ✓ {f.name} udah oke")
            continue
        
        # Update URL
        new = re.sub(
            r"(const API_BASE\s*=\s*['\"])([^'\"]+)(['\"])",
            rf"\g<1>{api_url}\g<3>",
            content
        )
        
        if new != content:
            f.write_text(new, encoding="utf-8")
            print(f"   ✅ Updated: {f.name}")
            need_build = True
    
    # Build kalau perlu
    dist = PROJECT_ROOT / "frontend" / "app" / "dist"
    
    if need_build or not (dist / "index.html").exists():
        print("   🔨 Building frontend (1-2 menit)...")
        try:
            r = subprocess.run(
                ["npm", "run", "build"],
                cwd=PROJECT_ROOT / "frontend" / "app",
                capture_output=True,
                text=True,
                timeout=300  # 5 menit timeout
            )
            
            if r.returncode != 0:
                print("   ❌ Build gagal!")
                # Print 10 baris terakhir error
                error_lines = r.stderr.strip().split('\n')[-10:]
                for line in error_lines:
                    print(f"      {line}")
                return False
            
            print("   ✅ Build sukses")
            return True
        except subprocess.TimeoutExpired:
            print("   ❌ Build timeout (>5 menit)")
            return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    else:
        print("   ✓ Udah ada build, skip rebuild")
        return True


def start_server():
    """Start FastAPI dengan frontend mounted"""
    import uvicorn
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    from app.api import app
    
    # Mount frontend static files
    dist = PROJECT_ROOT / "frontend" / "app" / "dist"
    
    if dist.exists():
        # Mount folder assets
        assets = dist / "assets"
        if assets.exists():
            app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")
        
        # SPA fallback - serve index.html untuk semua route non-API
        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa_fallback(full_path: str):
            # Skip API routes
            if full_path.startswith(("class/", "session/", "user/", "docs", "openapi.json", "redoc")):
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Not found")
            
            # Coba serve static file
            fp = dist / full_path
            if fp.is_file():
                return FileResponse(str(fp))
            
            # Fallback ke index.html (buat React Router)
            return FileResponse(str(dist / "index.html"))
    
    # Start server
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT, log_level="warning")


def wait_server(timeout=30):
    """Tunggu sampai server beneran ready"""
    import urllib.request
    
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            urllib.request.urlopen(f"http://localhost:{BACKEND_PORT}/docs", timeout=2)
            return True
        except:
            time.sleep(0.5)
    return False


def main():
    print("=" * 60)
    print("  🕌 AI NGAJI - Demo Server")
    print("=" * 60)
    
    # 1. Cek dependencies
    check_deps()
    
    # 2. Setup ngrok
    print("\n🌐 Setup ngrok...")
    from pyngrok import ngrok, conf
    conf.get_default().auth_token = NGROK_TOKEN
    ngrok.kill()  # Matikan tunnel lama
    
    # 3. Start server di background
    print("\n⚙️  Start server...")
    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    
    # Tunggu server ready
    print("   Nunggu server ready...")
    if not wait_server():
        print("   ❌ Server gagal start!")
        sys.exit(1)
    print("   ✅ Server ready!")
    
    # 4. Bikin ngrok tunnel
    print("\n🔗 Bikin tunnel...")
    try:
        tunnel = ngrok.connect(BACKEND_PORT)
        url = tunnel.public_url
        print(f"   ✅ {url}")
    except Exception as e:
        print(f"   ❌ Gagal bikin tunnel: {e}")
        print("   Cek apakah ngrok token udah bener")
        sys.exit(1)
    
    # 5. Build frontend dengan URL ngrok
    build_ok = build_frontend(url)
    
    # 6. Print info
    print("\n" + "=" * 60)
    print("  🎉 SIAP DEMO!")
    print("=" * 60)
    
    if build_ok:
        print(f"\n  🌐 URL Client : {url}")
    else:
        print(f"\n  ⚠️  Frontend gagal build")
        print(f"     Backend tetap jalan: {url}/docs")
    
    print(f"  📋 API Docs   : {url}/docs")
    print(f"\n  📱 Info buat Client:")
    print(f"     • Buka link: {url}")
    print(f"     • Pilih 'Saya Siswa' atau 'Saya Guru'")
    print(f"     • PIN Guru: NGAJI2024")
    print(f"\n  ⚠️  Catatan:")
    print(f"     • Laptop harus tetap nyala")
    print(f"     • Jangan tutup terminal ini")
    print(f"     • URL berubah setiap kali script dijalankan ulang")
    print(f"\n  🛑  Ctrl+C buat stop")
    print("=" * 60 + "\n")
    
    # 7. Keep alive dengan graceful shutdown
    def stop(sig, frame):
        print("\n\n🛑 Shutting down...")
        from pyngrok import ngrok
        ngrok.kill()
        print("✅ Done. Sampai jumpa!")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        stop(None, None)


if __name__ == "__main__":
    main()