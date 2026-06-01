import json
from rapidfuzz import fuzz
from src.phoneme_aligner import normalize_arabic_text

def match_transcript_to_ayahs(
    detected_text: str,
    json_path: str
):
    """
    Cocokkan transcript ke ayat Quran.
    """

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    verses = data.get("verse", {})

    results = []

    det_clean = normalize_arabic_text(detected_text)

    for key, verse_text in verses.items():

        if key == "verse_0":
            continue

        verse_clean = normalize_arabic_text(verse_text)

        score = fuzz.partial_ratio(
            verse_clean,
            det_clean
        )

        results.append({
            "ayah": key.replace("verse_", "Ayat "),
            "text": verse_text,
            "similarity": score
        })

    results.sort(
        key=lambda x: x["similarity"],
        reverse=True
    )

    return results