# src/score.py
import unicodedata

def score_tajwid(aligned_data: dict, rules: list) -> list:
    aligned_words = []
    for seg in aligned_data.get("segments", []):
        aligned_words.extend(seg.get("words", []))

    # Normalisasi & map kata hasil AI
    word_map = {}
    for w in aligned_words:
        key = unicodedata.normalize("NFC", w["word"].strip("،.،!?").replace(" ", ""))
        word_map[key] = w

    results = []
    for rule in rules:
        target = rule["word"]
        if target not in word_map:
            results.append({
                "verse": rule["verse"],
                "word": target,
                "rule": rule["rule"],
                "status": "missing",
                "actual_ms": None,
                "expected_ms": rule["min_ms"]
            })
            continue

        w = word_map[target]
        duration_ms = (w["end"] - w["start"]) * 1000
        status = "pass" if duration_ms >= rule["min_ms"] else "too_short"

        results.append({
            "verse": rule["verse"],
            "word": target,
            "rule": rule["rule"],
            "status": status,
            "actual_ms": round(duration_ms, 1),
            "expected_ms": rule["min_ms"]
        })
    return results