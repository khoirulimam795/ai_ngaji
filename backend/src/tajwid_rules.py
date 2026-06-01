# =============================================================================
# 📚 TAJWID RULE ENGINE
# =============================================================================

NOON_SUKUN = ['نْ', 'ً', 'ٍ', 'ٌ']
MEEM_SUKUN = ['مْ']

IDZHAR = ['ء', 'ه', 'ع', 'ح', 'غ', 'خ']

IKHFA = [
    'ت','ث','ج','د','ذ','ز',
    'س','ش','ص','ض','ط',
    'ظ','ف','ق','ك'
]

IDGHAM_BIGHUNNAH = ['ي', 'ن', 'م', 'و']

IDGHAM_BILAGHUNNAH = ['ل', 'ر']

IQLAB = ['ب']

QALQALAH = ['ق', 'ط', 'ب', 'ج', 'د']

MAD_LETTERS = ['ا', 'و', 'ي']


# =============================================================================
# 🔍 DETECT TAJWID
# =============================================================================

def detect_tajwid_rules(text: str):

    results = []

    words = text.split()

    for i, word in enumerate(words):

        next_word = ""

        if i + 1 < len(words):
            next_word = words[i + 1]

        combined = word + " " + next_word

        # =====================================================
        # IDZHAR
        # =====================================================

        for ns in NOON_SUKUN:

            if ns in word:

                idx = word.find(ns)

                after = ""

                if idx + len(ns) < len(word):
                    after = word[idx + len(ns)]

                elif next_word:
                    after = next_word[0]

                if after in IDZHAR:

                    results.append({
                        "rule": "idzhar",
                        "word": combined
                    })

        # =====================================================
        # IKHFA
        # =====================================================

        for ns in NOON_SUKUN:

            if ns in word:

                idx = word.find(ns)

                after = ""

                if idx + len(ns) < len(word):
                    after = word[idx + len(ns)]

                elif next_word:
                    after = next_word[0]

                if after in IKHFA:

                    results.append({
                        "rule": "ikhfa",
                        "word": combined
                    })

        # =====================================================
        # IDGHAM BIGHUNNAH
        # =====================================================

        for ns in NOON_SUKUN:

            if ns in word:

                idx = word.find(ns)

                after = ""

                if idx + len(ns) < len(word):
                    after = word[idx + len(ns)]

                elif next_word:
                    after = next_word[0]

                if after in IDGHAM_BIGHUNNAH:

                    results.append({
                        "rule": "idgham_bighunnah",
                        "word": combined
                    })

        # =====================================================
        # IDGHAM BILAGHUNNAH
        # =====================================================

        for ns in NOON_SUKUN:

            if ns in word:

                idx = word.find(ns)

                after = ""

                if idx + len(ns) < len(word):
                    after = word[idx + len(ns)]

                elif next_word:
                    after = next_word[0]

                if after in IDGHAM_BILAGHUNNAH:

                    results.append({
                        "rule": "idgham_bilaghunnah",
                        "word": combined
                    })

        # =====================================================
        # IQLAB
        # =====================================================

        for ns in NOON_SUKUN:

            if ns in word:

                idx = word.find(ns)

                after = ""

                if idx + len(ns) < len(word):
                    after = word[idx + len(ns)]

                elif next_word:
                    after = next_word[0]

                if after in IQLAB:

                    results.append({
                        "rule": "iqlab",
                        "word": combined
                    })

        # =====================================================
        # QALQALAH
        # =====================================================

        for q in QALQALAH:

            if q in word:

                results.append({
                    "rule": "qalqalah",
                    "word": word
                })

                break

        # =====================================================
        # MAD
        # =====================================================

        for m in MAD_LETTERS:

            if m in word:

                results.append({
                    "rule": "mad",
                    "word": word
                })

                break

    return results