import sys
from pathlib import Path
import tempfile
import json
import os
from app.routers.material_router import router as material_router
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
# Tambahkan di bagian import paling atas
from app.routers.class_router import router as class_router
from src.user_data import save_session, get_user_stats, get_user_history
from src.phoneme_aligner import verify_surah_match, analyze_tajwid_from_audio
from src.ayah_matcher import match_transcript_to_ayahs
from src.tajwid_engine import analyze_tajwid_rules
from src.word import extract_word_timestamps, match_tajwid_with_timestamps
from app.routers.comment_router import router as comment_router

app = FastAPI(title="AI NGAJI API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
async def root():
    return {"message": "AI NGAJI API is running", "status": "healthy"}

@app.get("/surahs")
def get_surahs():
    base_dir = Path(__file__).parent.parent
    path_surat = base_dir / "surat"

    if not path_surat.exists():
        return {"surahs": []}

    surahs = []
    for f in path_surat.glob("surah_*.json"):
        try:
            num = int(f.stem.replace("surah_", ""))
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                name = data.get("name", f"Surah {num}")
                total_verses = data.get("count", 0)
                if total_verses == 0:
                    verses = data.get("verse", {})
                    total_verses = len([k for k in verses.keys() if k != "verse_0"])
            surahs.append({
                "number": num,
                "name": name,
                "total_verses": total_verses
            })
        except Exception as e:
            print(f"Error loading {f}: {e}")
            continue

    surahs.sort(key=lambda x: x["number"])
    return {"surahs": surahs}


@app.get("/ayat/{surah_number}")
async def get_ayat(surah_number: int):
    base_dir = Path(__file__).parent.parent
    json_path = base_dir / "surat" / f"surah_{surah_number}.json"

    if not json_path.exists():
        raise HTTPException(404, f"Data surat {surah_number} tidak ditemukan")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    verses = data.get("verse", {})
    ayats = []
    for key, text in verses.items():
        if key == "verse_0":
            continue
        nomor = int(key.replace("verse_", ""))
        ayats.append({
            "nomor": nomor,
            "teks_arab": text,
            "transliterasi": "",
            "terjemahan": ""
        })

    ayats.sort(key=lambda x: x["nomor"])
    return {"ayats": ayats}

@app.post("/analyze")
async def analyze_audio(
    surah: int = Form(...),
    user_id: str = Form(...),
    class_code: str = Form(None),  # ← BARU: Terima class_code opsional
    file: UploadFile = File(...)
):
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    
    try:
        base_dir = Path(__file__).parent.parent
        json_path = base_dir / "surat" / f"surah_{surah}.json"

        if not json_path.exists():
            raise HTTPException(404, f"Data surat {surah} tidak ditemukan")

        with open(json_path, "r", encoding="utf-8") as f:
            surah_data = json.load(f)

        is_match, error_msg, detected = verify_surah_match(tmp_path, str(json_path), surah)
        if not is_match:
            return JSONResponse(status_code=400, content={"error": error_msg})

        ayah_matches = match_transcript_to_ayahs(detected, str(json_path))
        alignment_result = analyze_tajwid_from_audio(tmp_path, surah_data)
        word_segments = extract_word_timestamps(alignment_result)
        tajwid_results = analyze_tajwid_rules(detected, str(json_path))
        tajwid_results = match_tajwid_with_timestamps(tajwid_results, word_segments)

        correct = sum(1 for r in tajwid_results if r.get("status") == "correct")
        wrong = sum(1 for r in tajwid_results if r.get("status") != "correct")
        accuracy = (correct / (correct + wrong) * 100) if (correct + wrong) > 0 else 0

        for r in tajwid_results:
            r.pop("word_score", None)

        # ← UPDATE: Masukkan class_code ke save_session
        save_session(
            user_id=user_id,
            surah=surah,
            surah_name=surah_data.get("name", f"Surah {surah}"),
            accuracy=round(accuracy, 1),
            correct=correct,
            wrong=wrong,
            errors=tajwid_results,
            class_code=class_code  # ← BARU
        )

        return {
            "status": "success",
            "surah": surah,
            "surah_name": surah_data.get("name", f"Surah {surah}"),
            "detected_text": detected,
            "accuracy": round(accuracy, 1),
            "correct": correct,
            "wrong": wrong,
            "ayah_matches": ayah_matches[:5],
            "tajwid_results": tajwid_results
        }

    except Exception as e:
        print(f"Error in analyze: {e}")
        raise HTTPException(500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/user/session")
async def save_user_session(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(400, "user_id required")

    # ← UPDATE: Ambil class_code dari body jika ada
    session = save_session(
        user_id=user_id,
        surah=body.get("surah", 0),
        surah_name=body.get("surah_name", ""),
        accuracy=body.get("accuracy", 0),
        correct=body.get("correct", 0),
        wrong=body.get("wrong", 0),
        errors=body.get("errors", []),
        class_code=body.get("class_code", None)  # ← BARU
    )

    return {"status": "success", "session": session}


@app.get("/user/{user_id}/stats")
async def get_stats(user_id: str):
    stats = get_user_stats(user_id)
    return {"stats": stats}


@app.get("/user/{user_id}/history")
async def get_history(user_id: str, limit: int = 10):
    history = get_user_history(user_id, limit)
    return {"history": history}


# ============================================================
# SERVE FRONTEND — HARUS DI PALING BAWAH SETELAH SEMUA ROUTE
# ============================================================
dist_path = Path(__file__).parent.parent.parent / "frontend" / "app" / "dist"

if dist_path.exists():
    print(f"✅ Frontend dist ditemukan: {dist_path}")
    app.include_router(class_router)
    app.include_router(comment_router)
    app.include_router(material_router)
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")
else:
    print(f"⚠️  dist/ tidak ditemukan di: {dist_path}")
    print(f"   Jalanin dulu: cd frontend/app && npm run build")
