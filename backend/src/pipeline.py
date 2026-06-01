# pipeline.py - VERSI FIX
import json
from pathlib import Path
from .audio_processor import load_audio
from .aligner import align_recitation  # ← SEKARANG TERIMA PATH
from .tajwid_parse import load_tajwid_rules
from .score import score_tajwid

def run_analysis(surah_num: int, audio_path: str, report_dir: str = "report"):
    print(f"🚀 Memulai analisis Surah {surah_num}...")

    print("🎵 Memuat audio...")
    print("🔗 Melakukan alignment (WhisperX)...")
    aligned_data = align_recitation(audio_path)  # ← LANGSUNG KASIH PATH

    print("📖 Membaca aturan tajwid dari JSON...")
    rules = load_tajwid_rules(surah_num)
    print(f"   ✅ Ditemukan {len(rules)} potensi aturan tajwid.")

    print("📊 Menilai bacaan...")
    results = score_tajwid(aligned_data, rules)

    Path(report_dir).mkdir(parents=True, exist_ok=True)
    report_path = Path(report_dir) / f"report_surah_{surah_num}.json"

    report_data = {
        "surah": surah_num,
        "total_checks": len(results),
        "errors": [r for r in results if r["status"] != "pass"],
        "details": results
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Analisis selesai. Report tersimpan di: {report_path}")
    return report_data