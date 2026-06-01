# src/tajwid_engine.py
import json
import re
import unicodedata
from rapidfuzz import fuzz
from src.tajwid_rules import detect_tajwid_rules

def normalize_arabic(text: str):
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    replacements = {
        "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "ؤ": "و", "ئ": "ي",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"[^\u0600-\u06FF ]", "", text)
    return text.strip()

def extract_tajwid_rules(ayah_text):
    """Ekstrak aturan tajwid dari teks ayat pakai tajwid_rules.py"""
    rules_raw = detect_tajwid_rules(ayah_text)
    converted = []
    for r in rules_raw:
        converted.append({
            "rule": r["rule"],
            "matched_text": r["word"],   # <- inilah kunci yang hilang
            "word": r["word"]
        })
    return converted

def analyze_tajwid_rules(detected_text, quran_json_path):
    with open(quran_json_path, "r", encoding="utf-8") as f:
        surah = json.load(f)

    verses = surah.get("verse", {}) or surah.get("verse ", {})
    detected_clean = normalize_arabic(detected_text)
    final_results = []

    for ayah_key, ayah_text in verses.items():
        if ayah_key == "verse_0":
            continue

        ayah_clean = normalize_arabic(ayah_text)
        similarity = fuzz.partial_ratio(ayah_clean, detected_clean)
        if similarity < 50:
            continue

        tajwid_rules = extract_tajwid_rules(ayah_text)

        for rule in tajwid_rules:
            matched_clean = normalize_arabic(rule["matched_text"])
            detected_words = detected_clean.split()
            best_score = 0
            for dw in detected_words:
                s = fuzz.ratio(matched_clean, dw)
                if s > best_score:
                    best_score = s
            score = best_score

            # Threshold
            if rule["rule"] == "mad":
                threshold = 72
            elif rule["rule"] == "ikhfa":
                threshold = 70
            elif rule["rule"] == "idzhar":
                threshold = 70
            elif rule["rule"] == "idgham_bighunnah":
                threshold = 68
            elif rule["rule"] == "idgham_bilaghunnah":
                threshold = 68
            elif rule["rule"] == "iqlab":
                threshold = 70
            elif rule["rule"] == "qalqalah":
                threshold = 75
            else:
                threshold = 75

            if score >= 85:
                status = "correct"
                severity = "minor"
                message = "bacaan benar"
            elif score >= threshold:
                status = "warning"
                severity = "medium"
                message = f"{rule['rule']} kurang tepat"
            else:
                status = "wrong"
                severity = "high"
                message = f"{rule['rule']} salah"

            final_results.append({
                "ayah": ayah_key.replace("verse_", "Ayat "),
                "ayah_text": ayah_text,
                "rule": rule["rule"],
                "matched_text": rule["matched_text"],
                "status": status,
                "score": score,
                "threshold": threshold,
                "severity": severity,
                "message": message
            })

    return final_results