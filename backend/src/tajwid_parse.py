# src/tajwid_parse.py
import json
import re
import unicodedata
from pathlib import Path

THRESHOLDS = {
    "ghunnah_mushaddadah": 180,
    "mad_wajib_muttasil": 320,
    "mad_natural": 280,
    "qalqalah": 140,
    "idgham_bighunnah": 200,
    "idgham_bilaghunnah": 140,
    "ikhfa_shafawi": 150,
    "ikhfa_haqiqi": 160
}

PATTERNS = [
    (r"ـّـ[نم]", "ghunnah_mushaddadah"),
    (r"ـٰ", "mad_wajib_muttasil"),
    (r"[اىو]ـ[ًٌٍْ]", "mad_natural"),
    (r"[ق ط ب ج د]ْ", "qalqalah"),
    (r"نْ\s*[ورل]", "idgham_bilaghunnah"),
    (r"نْ\s*[يمو]", "idgham_bighunnah"),
    (r"مْن\s*ب", "ikhfa_shafawi"),
    (r"نْ\s*[ثجسصزضشظذتدغفقكخهءحع]", "ikhfa_haqiqi")
]

def load_tajwid_rules(surah_num: int, surat_dir: str = "surat") -> list:
    path = Path(surat_dir) / f"surah_{surah_num}.json"
    if not path.exists():
        raise FileNotFoundError(f"❌ File JSON tidak ditemukan: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    verses = data.get("verse", {})
    rules = []

    for key, text in verses.items():
        key_clean = key.strip()
        if not key_clean.startswith("verse_"):
            continue
            
        try:
            verse_num = int(key_clean.split("_")[1])
        except ValueError:
            continue

        # verse_0 = Bismillah (bisa diskip jika tidak ingin dianalisa)
        if verse_num == 0:
            continue

        text_clean = unicodedata.normalize("NFC", text.strip())
        words = text_clean.split()

        for word in words:
            word_nfc = unicodedata.normalize("NFC", word)
            for pattern, rule_name in PATTERNS:
                if re.search(pattern, word_nfc):
                    rules.append({
                        "verse": verse_num,
                        "word": word_nfc,
                        "rule": rule_name,
                        "min_ms": THRESHOLDS.get(rule_name, 150)
                    })
    return rules