# app/main.py

import sys
import json

from pathlib import Path

from src.pipeline import run_analysis

from src.word import (
    extract_word_timestamps,
    match_tajwid_with_timestamps
)

from src.phoneme_aligner import (
    verify_surah_match,
    analyze_tajwid_from_audio
)

from src.phoneme_engine import (
    analyze_phoneme_engine
)

from src.ayah_matcher import (
    match_transcript_to_ayahs
)

from src.tajwid_engine import (
    analyze_tajwid_rules
)

# =============================================================================
# GET AVAILABLE SURAHS
# =============================================================================

def get_available_surahs(
    surat_dir: str = "surat"
):

    surahs = []

    for f in Path(surat_dir).glob(
        "surah_*.json"
    ):

        try:

            num = int(
                f.stem.replace(
                    "surah_",
                    ""
                ).strip()
            )

            surahs.append(num)

        except:
            pass

    return sorted(surahs)


# =============================================================================
# MAIN
# =============================================================================

def main():

    print("🕌 AI NGAJI - REAL TAJWID AI")
    print("=" * 60)

    surahs = get_available_surahs()

    if not surahs:

        print("❌ Tidak ada file surat.")
        sys.exit(1)

    print(f"📚 Surat tersedia: {surahs}")

    # =============================================================================
    # PILIH SURAT
    # =============================================================================

    try:

        choice = int(
            input(
                "\n🔢 Masukkan nomor surat: "
            )
        )

        if choice not in surahs:

            raise ValueError(
                "Nomor surat tidak tersedia."
            )

    except Exception as e:

        print(f"❌ {e}")
        sys.exit(1)

    # =============================================================================
    # INPUT AUDIO
    # =============================================================================

    rec_mode = input(
        "🎙️ Rekam langsung dari mic? (y/n): "
    ).strip().lower()

    audio_dir = Path("audio")
    audio_dir.mkdir(exist_ok=True)

    if rec_mode == "y":

        audio_path = str(
            audio_dir / f"user_{choice}.wav"
        )

        try:

            from app.auto_record import (
                record_audio
            )

            print("\n🎙️ Recording...")

            record_audio(audio_path)

        except Exception as e:

            print(f"❌ Gagal record: {e}")
            sys.exit(1)

    else:

        audio_path = input(
            "📂 Masukkan path audio: "
        ).strip()

        if not Path(audio_path).exists():

            print("❌ File audio tidak ditemukan.")
            sys.exit(1)

    # =============================================================================
    # MODE
    # =============================================================================

    use_phoneme = input(
        "🔊 Gunakan phoneme engine? (y/n): "
    ).strip().lower() == "y"

    # =============================================================================
    # LOAD JSON
    # =============================================================================

    json_path = (
        Path("surat")
        / f"surah_{choice}.json"
    )

    if not json_path.exists():

        print("❌ JSON surat tidak ditemukan.")
        sys.exit(1)

    with open(
        json_path,
        "r",
        encoding="utf-8"
    ) as f:

        surah_data = json.load(f)

    # =============================================================================
    # VERIFY SURAH
    # =============================================================================

    print("\n🔍 Verifying surah...")
    print("=" * 60)

    is_match, error_msg, detected = verify_surah_match(
        audio_path=audio_path,
        json_path=str(json_path),
        surah_number=choice
    )

    if not is_match:

        print(f"❌ {error_msg}")
        sys.exit(1)

    print("✅ Audio sesuai surat")

    # =============================================================================
    # RUN PIPELINE (TAMBAHKAN 5 BARIS INI)
    # =============================================================================

    print("\n🚀 Menjalankan pipeline analisis...")
    report = run_analysis(choice, audio_path)
    print(f"📊 Pipeline: {report['total_checks']} rule dicek, {len(report['errors'])} error")

    # =============================================================================
    # MATCH AYAT
    # =============================================================================

    print("\n📖 AYAT TERDETEKSI")
    print("=" * 60)

    ayah_matches = match_transcript_to_ayahs(
        detected_text=detected,
        json_path=str(json_path)
    )

    for a in ayah_matches[:5]:

        print(
            f"{a['ayah']} | "
            f"{a['similarity']:.1f}%"
        )

        print(a["text"])
        print()

    # =============================================================================
    # BUILD FULL TEXT
    # =============================================================================

    raw_verses = (
        surah_data.get("verse", {})
        or surah_data.get("verse ", {})
    )

    verses_text = []

    for k, v in raw_verses.items():

        k_clean = k.strip()

        if (
            k_clean.startswith("verse_")
            and k_clean != "verse_0"
        ):

            verses_text.append(v.strip())

    full_text = " ".join(verses_text)

    # =============================================================================
    # PHONEME ENGINE
    # =============================================================================

    phoneme_results = {}

    if use_phoneme:

        print("\n🧠 Running phoneme engine...")
        print("=" * 60)

        phoneme_results = analyze_phoneme_engine(
            expected_text=full_text,
            detected_text=detected
        )

        print(
            f"✅ Phoneme similarity: "
            f"{phoneme_results.get('score', 0):.1f}%"
        )

        print(
            f"🎯 STATUS: "
            f"{phoneme_results.get('status', '-')}"
        )

    # =============================================================================
    # AUDIO ALIGNMENT
    # =============================================================================

    print("\n🧠 Audio alignment...")
    print("=" * 60)

    alignment_result = analyze_tajwid_from_audio(
        audio_path,
        surah_data
    )

    # =============================================================================
    # WORD TIMESTAMPS
    # =============================================================================

    word_segments = []

    try:

        word_segments = extract_word_timestamps(
            alignment_result
        )

    except Exception as e:

        print(f"⚠️ Word timestamp error: {e}")

    # =============================================================================
    # REAL TAJWID VERIFICATION
    # =============================================================================

    print("\n🧠 Real Tajwid Verification...")
    print("=" * 60)

    tajwid_results = analyze_tajwid_rules(
        detected_text=detected,
        quran_json_path=str(json_path)
    )

    # =============================================================================
    # MATCH TIMESTAMPS
    # =============================================================================

    try:

        tajwid_results = match_tajwid_with_timestamps(
            tajwid_results,
            word_segments
        )

    except Exception as e:

        print(f"⚠️ Timestamp matching error: {e}")

        # =============================================================================
    # RESULT DENGAN DURASI DARI AUDIO
    # =============================================================================

    # Buat dictionary durasi dari alignment_result (dari analyze_tajwid_from_audio)
    duration_map = {}
    
    # alignment_result adalah list dari analyze_tajwid_from_audio
    # isinya: [{'ayah': 'Ayat 1', 'word': 'أَعُوذُ', 'rule': 'mad', 'duration': 0.45, 'status': 'correct'}, ...]
    for item in alignment_result:
        # Buat key unik: ayat + word + rule
        key = f"{item.get('ayah', '')}_{item.get('word', '')}_{item.get('rule', '')}"
        duration_map[key] = {
            'duration': item.get('duration', 0),
            'audio_status': item.get('status', 'unknown')
        }
    
    correct_count = 0
    wrong_count = 0
    warning_count = 0  # Tambahin warning buat yang durasi kurang
    
    for r in tajwid_results:
        
        # Buat key yang sama buat nyari durasi
        matched_word = r['matched_text'].split()[0] if r['matched_text'] else ''
        key = f"{r['ayah']}_{matched_word}_{r['rule']}"
        
        # Ambil durasi dari alignment_result kalo ada
        audio_duration = duration_map.get(key, {}).get('duration', 0)
        audio_status = duration_map.get(key, {}).get('audio_status', 'unknown')
        
        # =============================================================
        # KOMBINASI STATUS: dari teks (similarity) + dari audio (duration)
        # =============================================================
        
        text_status = r['status']  # dari analyze_tajwid_rules (similarity)
        text_score = r['score']
        
        # Logika kombinasi
        if text_status == 'wrong' and audio_status == 'wrong':
            final_status = 'wrong'
            final_message = r['message'] + " (duration error)"
            final_severity = 'high'
            final_score = min(text_score, 30)
            
        elif text_status == 'wrong' and audio_status == 'correct':
            final_status = 'warning'
            final_message = r['message'] + " (tapi durasi ok)"
            final_severity = 'medium'
            final_score = 60
            
        elif text_status == 'correct' and audio_status == 'wrong':
            final_status = 'warning'
            final_message = f"Durasi {audio_duration:.2f}s, target minimal 0.15-0.40s"
            final_severity = 'medium'
            final_score = 65
            
        elif text_status == 'correct' and audio_status == 'correct':
            final_status = 'correct'
            final_message = f"✅ {r['message']} (durasi {audio_duration:.2f}s)"
            final_severity = 'low'
            final_score = 100
            
        elif audio_status == 'too_short' or (audio_duration > 0 and audio_duration < 0.15):
            final_status = 'wrong'
            final_message = f"❌ Durasi terlalu pendek: {audio_duration:.2f}s (min 0.15s untuk ghunnah, 0.40s untuk mad)"
            final_severity = 'high'
            final_score = 40
            
        elif audio_duration > 0 and r['rule'] in ['mad', 'mad_asli']:
            if audio_duration < 0.35:
                final_status = 'wrong'
                final_message = f"❌ Mad terlalu pendek: {audio_duration:.2f}s (harus 2 harakat ≈ 0.40-0.60s)"
                final_severity = 'high'
                final_score = 35
            elif audio_duration > 0.70:
                final_status = 'warning'
                final_message = f"⚠️ Mad terlalu panjang: {audio_duration:.2f}s (ideal 0.40-0.60s)"
                final_severity = 'medium'
                final_score = 70
            else:
                final_status = 'correct'
                final_message = f"✅ Mad benar: {audio_duration:.2f}s"
                final_severity = 'low'
                final_score = 100
                
        else:
            final_status = text_status
            final_message = r['message']
            final_severity = r['severity']
            final_score = text_score
        
        # Hitung statistik
        if final_status == 'correct':
            correct_count += 1
        elif final_status == 'warning':
            warning_count += 1
        else:
            wrong_count += 1
        
        icon = "✅" if final_status == "correct" else ("⚠️" if final_status == "warning" else "❌")
        
        # Tampilkan dengan durasi
        print(f"""
[{r.get('start', 0):.2f}s - {r.get('end', 0):.2f}s] 🎤 Durasi: {audio_duration:.2f}s

{icon} AYAT:
{r['ayah']}

📖 TEKS:
{r['ayah_text']}

⚠️ BAGIAN:
{r['matched_text']}

📚 TAJWID:
{final_message}

🎯 STATUS:
{final_status}

📊 SCORE:
{final_score:.1f}

🔥 SEVERITY:
{final_severity}
""")
    
    # =============================================================================
    # SUMMARY dengan warning
    # =============================================================================
    
    print("=" * 60)
    print(f"✅ TAJWID BENAR   : {correct_count}")
    print(f"⚠️ TAJWID WARNING : {warning_count}")
    print(f"❌ TAJWID SALAH   : {wrong_count}")
    
    total = correct_count + warning_count + wrong_count
    if total > 0:
        weighted_score = (correct_count * 100 + warning_count * 60) / total
        print(f"📊 WEIGHTED SCORE : {weighted_score:.1f}%")
    
    if wrong_count == 0 and warning_count == 0:
        print("\n🎉 Bacaan sangat bagus! Pertahankan!")
    elif wrong_count == 0:
        print("\n👍 Bacaan baik, perhatikan durasi beberapa huruf.")
    elif wrong_count <= 2:
        print("\n👍 Bacaan cukup baik, fokus perbaiki yang salah.")
    else:
        print("\n⚠️ Perlu latihan tajwid lagi, terutama durasi mad dan ghunnah.")


# =============================================================================
# START
# =============================================================================

if __name__ == "__main__":

    main()