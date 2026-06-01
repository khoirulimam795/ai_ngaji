# =============================================================================
# IMPORTS
# =============================================================================

import torch
import whisperx
import librosa
import json
import re
import unicodedata

from typing import Dict, Tuple, List
from rapidfuzz import fuzz

# =============================================================================
# ⚙️ CONFIG
# =============================================================================

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

WHISPER_MODEL_SIZE = "medium"

# =============================================================================
# 📥 LOAD MODEL
# =============================================================================

print("📥 Loading WhisperX model...")

WHISPER_MODEL = whisperx.load_model(
    WHISPER_MODEL_SIZE,
    device=DEVICE,
    compute_type="float16" if DEVICE == "cuda" else "int8"
)

print("✅ WhisperX loaded!")

# =============================================================================
# 🔤 NORMALIZATION
# =============================================================================

def normalize_arabic_text(text: str) -> str:

    text = unicodedata.normalize("NFD", text)

    text = "".join(
        c for c in text
        if unicodedata.category(c) != "Mn"
    )

    replacements = {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ة": "ه",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(
        r"[^\u0600-\u06FFa-zA-Z0-9\s]",
        "",
        text
    )

    return text.lower().strip()

# =============================================================================
# 🔍 VERIFY SURAH
# =============================================================================

def verify_surah_match(
    audio_path: str,
    json_path: str,
    surah_number: int
) -> Tuple[bool, str, str]:

    print("🔍 Verifying surah match...")

    try:

        with open(json_path, "r", encoding="utf-8") as f:
            surah_data = json.load(f)

        verses = surah_data.get("verse", {})

        expected_text = " ".join(
            v.strip()
            for k, v in verses.items()
            if k.strip() != "verse_0"
        )

        exp_clean = normalize_arabic_text(expected_text)

        print("🎵 Loading audio...")

        audio = whisperx.load_audio(audio_path)

        print("🧠 Transcribing Arabic audio...")

        result = WHISPER_MODEL.transcribe(
            audio,
            language="ar",
            batch_size=4
        )

        detected_text = " ".join(
            seg["text"]
            for seg in result.get("segments", [])
        ).strip()

        det_clean = normalize_arabic_text(detected_text)

        similarity = fuzz.partial_ratio(
            exp_clean,
            det_clean
        )

        print("\n📖 EXPECTED:")
        print(expected_text[:200])

        print("\n🎤 DETECTED:")
        print(detected_text[:200])

        print(f"\n📊 Similarity Score: {similarity:.2f}%")

        is_match = similarity >= 65

        if is_match:
            print("✅ Audio cocok dengan surat.")
            return True, "", detected_text

        return (
            False,
            f"Audio kemungkinan bukan Surah {surah_number}",
            detected_text
        )

    except Exception as e:

        print(f"❌ Verification Error: {e}")

        return False, str(e), ""

# =============================================================================
# 🎯 TAJWID RULES
# =============================================================================

MAD_LETTERS = ['ا', 'و', 'ي']

QALQALAH_LETTERS = [
    'ق', 'ط', 'ب', 'ج', 'د'
]

IKHFA_LETTERS = [
    'ت', 'ث', 'ج', 'د', 'ذ',
    'ز', 'س', 'ش', 'ص', 'ض',
    'ط', 'ظ', 'ف', 'ق', 'ك'
]

# =============================================================================
# ⏱️ THRESHOLDS
# =============================================================================

THRESHOLDS = {

    # mad asli biasanya lebih fleksibel
    "mad": 0.30,

    # dengung
    "ghunnah": 0.16,

    # pantulan huruf
    "qalqalah": 0.07,

    # samar
    "ikhfa": 0.14,

    # jelas
    "idzhar": 0.10,

    # lebur dengung
    "idgham_bighunnah": 0.16,

    # lebur tanpa dengung
    "idgham_bilaghunnah": 0.10,

    # mim jadi mim
    "iqlab": 0.15,
}

# =============================================================================
# 🔍 DETECT TAJWID
# =============================================================================

def detect_tajwid_in_word(word: str) -> List[str]:

    rules = []

    clean_word = normalize_arabic_text(word)

    # =========================
    # MAD
    # =========================

    if any(c in clean_word for c in MAD_LETTERS):
        rules.append("mad")

    # =========================
    # QALQALAH
    # =========================

    if any(c in clean_word for c in QALQALAH_LETTERS):
        rules.append("qalqalah")

    # =========================
    # GHUNNAH
    # =========================

    if "ن" in clean_word or "م" in clean_word:
        rules.append("ghunnah")

    # =========================
    # IKHFA
    # =========================

    for c in IKHFA_LETTERS:
        if c in clean_word:
            rules.append("ikhfa")
            break

    return list(set(rules))

# =============================================================================
# 🧠 ANALYZE TAJWID FROM AUDIO
# =============================================================================

def analyze_tajwid_from_audio(
    audio_path: str,
    surah_data: dict
):

    print("\n🧠 Running Tajwid Analysis...")

    audio = whisperx.load_audio(audio_path)

    result = WHISPER_MODEL.transcribe(
        audio,
        language="ar",
        batch_size=4
    )

    segments = result.get("segments", [])

    if not segments:
        return []

    reports = []

    verses = surah_data.get("verse", {})

    print("\n📋 HASIL ANALISIS TAJWID")
    print("=" * 70)

    for seg in segments:

        words = seg.get("words", [])

        for w in words:

            word = w.get("word", "").strip()

            start = w.get("start")
            end = w.get("end")

            if (
                not word or
                start is None or
                end is None
            ):
                continue

            duration = end - start

            rules = detect_tajwid_in_word(word)

            # =========================
            # CARI AYAT ASLI
            # =========================

            matched_ayah = "-"
            matched_text = "-"

            for ayah_key, ayah_text in verses.items():

                if ayah_key == "verse_0":
                    continue

                if word in ayah_text:

                    matched_ayah = ayah_key.replace(
                        "verse_",
                        "Ayat "
                    )

                    matched_text = ayah_text

                    break

            # =========================
            # CHECK RULES
            # =========================

            for rule in rules:

                threshold = THRESHOLDS.get(
                    rule,
                    0.15
                )

                tolerance = threshold * 0.80

                status = (
                    "correct"
                    if duration >= tolerance
                    else "wrong"
                )

                reports.append({

                    "ayah": matched_ayah,

                    "ayah_text": matched_text,

                    "word": word,

                    "rule": rule,

                    "duration": duration,

                    "threshold": threshold,

                    "status": status,
                })

                icon = (
                    "✅"
                    if status == "pass"
                    else "⚠️"
                )

                print(
                    f"{icon} "
                    f"{matched_ayah:8s} | "
                    f"{word:15s} | "
                    f"{rule:10s} | "
                    f"{duration:.2f}s"
                )

    return reports