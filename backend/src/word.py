# src/word_timestamps.py

from rapidfuzz import fuzz


# =============================================================================
# EXTRACT WORD TIMESTAMPS
# =============================================================================

def extract_word_timestamps(alignment_result):

    words_data = []

    # =============================================================================
    # HANDLE DICT / LIST
    # =============================================================================

    if isinstance(alignment_result, dict):

        segments = alignment_result.get(
            "segments",
            []
        )

    elif isinstance(alignment_result, list):

        segments = alignment_result

    else:

        return []

    # =============================================================================
    # LOOP SEGMENTS
    # =============================================================================

    for segment in segments:

        if not isinstance(segment, dict):
            continue

        words = segment.get(
            "words",
            []
        )

        # =============================================================================
        # LOOP WORDS
        # =============================================================================

        for w in words:

            if not isinstance(w, dict):
                continue

            word = (
                w.get("word", "")
                .strip()
            )

            start = w.get(
                "start",
                0
            )

            end = w.get(
                "end",
                0
            )

            score = w.get(
                "score",
                0
            )

            if not word:
                continue

            words_data.append({

                "word": word,

                "start": start,

                "end": end,

                "score": score
            })

    return words_data


# =============================================================================
# MATCH WORD WITH TAJWID
# =============================================================================

def match_tajwid_with_timestamps(
    tajwid_results,
    word_timestamps
):

    final_results = []

    for tajwid in tajwid_results:

        target_word = tajwid[
            "matched_text"
        ].split()[0]

        best_match = None
        best_score = 0

        for word_data in word_timestamps:

            similarity = fuzz.ratio(

                target_word,
                word_data["word"]
            )

            if similarity > best_score:

                best_score = similarity
                best_match = word_data

        # =============================================================================
        # SAVE MATCH
        # =============================================================================

        if best_match:

            final_results.append({

                **tajwid,

                "start":
                    best_match["start"],

                "end":
                    best_match["end"],

                "word_score":
                    best_match["score"]
            })

        else:

            final_results.append({

                **tajwid,

                "start": 0,
                "end": 0,
                "word_score": 0
            })

    return final_results