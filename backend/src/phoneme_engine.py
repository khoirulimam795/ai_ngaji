# src/phoneme_engine.py

import re
import unicodedata

from rapidfuzz import fuzz


# =============================================================================
# NORMALIZE
# =============================================================================

def normalize_arabic(text):

    text = unicodedata.normalize(
        "NFD",
        text
    )

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

        text = text.replace(
            old,
            new
        )

    text = re.sub(
        r"[^\u0600-\u06FF ]",
        "",
        text
    )

    return text.strip()


# =============================================================================
# SIMPLE ARABIC PHONEME MAP
# =============================================================================

PHONEME_MAP = {

    "ا": "a",
    "ب": "b",
    "ت": "t",
    "ث": "th",
    "ج": "j",
    "ح": "h7",
    "خ": "kh",
    "د": "d",
    "ذ": "dz",
    "ر": "r",
    "ز": "z",
    "س": "s",
    "ش": "sy",
    "ص": "sh9",
    "ض": "dh9",
    "ط": "th9",
    "ظ": "zh9",
    "ع": "3",
    "غ": "gh",
    "ف": "f",
    "ق": "q",
    "ك": "k",
    "ل": "l",
    "م": "m",
    "ن": "n",
    "ه": "h",
    "و": "w",
    "ي": "y",
}


# =============================================================================
# ARABIC TO PHONEME
# =============================================================================

def arabic_to_phonemes(text):

    text = normalize_arabic(text)

    phonemes = []

    for char in text:

        if char == " ":

            phonemes.append(" ")

            continue

        phonemes.append(

            PHONEME_MAP.get(
                char,
                char
            )
        )

    return "".join(phonemes)


# =============================================================================
# COMPARE PHONEMES
# =============================================================================

def compare_phonemes(
    expected,
    detected
):

    expected_ph = arabic_to_phonemes(
        expected
    )

    detected_ph = arabic_to_phonemes(
        detected
    )

    score = fuzz.ratio(
        expected_ph,
        detected_ph
    )

    status = (
        "correct"
        if score >= 85
        else "wrong"
    )

    return {

        "expected_phoneme":
            expected_ph,

        "detected_phoneme":
            detected_ph,

        "score":
            score,

        "status":
            status
    }


# =============================================================================
# ANALYZE PHONEME ENGINE
# =============================================================================

def analyze_phoneme_engine(
    expected_text,
    detected_text
):

    expected_phoneme = arabic_to_phonemes(
        expected_text
    )

    detected_phoneme = arabic_to_phonemes(
        detected_text
    )

    score = fuzz.ratio(
        expected_phoneme,
        detected_phoneme
    )

    status = (
        "correct"
        if score >= 85
        else "wrong"
    )

    severity = (
        "minor"
        if score >= 85
        else "major"
    )

    return {

        "expected_phoneme": expected_phoneme,

        "detected_phoneme": detected_phoneme,

        "score": score,

        "status": status,

        "severity": severity
    }