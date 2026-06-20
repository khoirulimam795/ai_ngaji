import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Square, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/api';
import * as THREE from 'three';
import ClassJoinPrompt from '@/components/ClassJoinPrompt';
import { toastSuccess, toastError } from '@/lib/toast';

interface TajwidResult {
  ayah: string;
  ayah_text: string;
  rule: string;
  matched_text: string;
  status: 'correct' | 'warning' | 'wrong';
  score: number;
  message: string;
}

export default function RekamBacaan() {
  const navigate = useNavigate();
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [surahList, setSurahList] = useState<any[]>([]);
  const [ayats, setAyats] = useState<any[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [tajwidResults, setTajwidResults] = useState<TajwidResult[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);
  const [statusText, setStatusText] = useState('⚪ Belum ada rekaman');
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const correctAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingCorrect, setIsPlayingCorrect] = useState(false);
  const [selectedQari, setSelectedQari] = useState('ar.alafasy');

  const QARI_OPTIONS = [
    { id: 'ar.alafasy', name: 'Misyari Rasyid', country: 'Kuwait' },
    { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit', country: 'Mesir' },
    { id: 'ar.alsudais', name: 'Abdurrahman Sudais', country: 'Arab Saudi' },
    { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', country: 'Mesir' },
    { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', country: 'Mesir' },
    { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', country: 'Arab Saudi' },
    { id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', country: 'Arab Saudi' },
  ];

  // ========== THREE.JS BACKGROUND ==========
  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030b17);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    function animate() {
      requestAnimationFrame(animate);
      stars.rotation.y += 0.0005;
      stars.rotation.x += 0.0003;
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // ========== LOAD DATA ==========
  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      const res = await fetch(`${API_BASE}/surahs`);
      const data = await res.json();
      setSurahList(data.surahs || []);
      if (data.surahs?.length) {
        setCurrentSurahId(data.surahs[0].number);
        fetchAyat(data.surahs[0].number);
      }
    } catch (err) {
      console.error('Gagal load surah:', err);
    }
  };

  const fetchAyat = async (surahId: number) => {
    try {
      const res = await fetch(`${API_BASE}/ayat/${surahId}`);
      const data = await res.json();
      setAyats(data.ayats || []);
    } catch (err) {
      console.error('Gagal load ayat:', err);
    }
  };

  // ========== REKAM ==========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
          audioRef.current.style.display = 'block';
        }
        setStatusText('✅ Rekaman selesai! Klik Analisis');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setStatusText('🔴 Sedang merekam...');
    } catch (err) {
      setStatusText('❌ Izin mikrofon diperlukan');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // ========== ANALISIS ==========
  const analyzeAudio = async () => {
    if (!recordedBlob) {
      toastError('Rekam atau upload file dulu');
      return;
    }
    setProcessing(true);
    setStatusText('🤖 AI sedang menganalisis...');

    const userId = localStorage.getItem('ngaji_user_id') || 'unknown';
    const classCode = localStorage.getItem('ngaji_student_class_code') || undefined;

    const formData = new FormData();
    formData.append('surah', currentSurahId.toString());
    formData.append('user_id', userId);
    formData.append('file', recordedBlob, 'recording.wav');

    if (classCode) {
      formData.append('class_code', classCode);
    }

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      setAccuracy(result.accuracy || 0);
      setCorrectCount(result.correct || 0);
      setWrongCount(result.wrong || 0);
      setTajwidResults(result.tajwid_results || []);
      toastSuccess('✅ Analisis selesai!');

      if (result.status === 'success' && !classCode) {
        setShowJoinPrompt(true);
      }
    } catch (err) {
      console.error('Analisis gagal:', err);
      toastError('Gagal analisis. Coba lagi ya.');
    } finally {
      setProcessing(false);
    }
  };

  // ========== AUDIO QARI ==========
  // ========== GET AUDIO URL (FIXED) ==========
  const getQariAudioUrl = (surahNumber: number, ayahNumber: number, qariId: string = 'Alafasy_128kbps') => {
    // Menggunakan EveryAyah.com - LEBIH RELIABLE untuk per-ayah
    // Format: https://everyayah.com/data/{Qari}/{SSSAAA}.mp3
    // SSS = Surah (3 digit), AAA = Ayah (3 digit)

    const qariMap: Record<string, string> = {
      'ar.alafasy': 'Alafasy_128kbps',
      'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
      'ar.alsudais': 'Abdurrahmaan_As-Sudais_192kbps',
      'ar.husary': 'Husary_128kbps',
      'ar.minshawi': 'Minshawy_Murattal_128kbps',
      'ar.muhammadayyoub': 'Muhammad_Ayyoub_128kbps',
      'ar.mahermuaiqly': 'Maher_AlMuaiqly_64kbps',
    };

    const qariFolder = qariMap[qariId] || 'Alafasy_128kbps';
    const surahStr = surahNumber.toString().padStart(3, '0');
    const ayahStr = ayahNumber.toString().padStart(3, '0');

    const url = `https://everyayah.com/data/${qariFolder}/${surahStr}${ayahStr}.mp3`;

    // 🔥 DEBUG: Log URL yang digenerate
    console.log('🎵 Audio URL:', url);

    return url;
  };

  const playCorrectRecitation = async (surahNum: number, ayahNum: number) => {
    try {
      setIsPlayingCorrect(true);
      const audioUrl = getQariAudioUrl(surahNum, ayahNum, selectedQari);

      console.log('🎧 Mencoba memutar:', audioUrl);

      if (!correctAudioRef.current) {
        console.error('Audio ref tidak tersedia');
        setIsPlayingCorrect(false);
        return;
      }

      // Preload audio dulu
      correctAudioRef.current.preload = 'auto';
      correctAudioRef.current.src = audioUrl;
      correctAudioRef.current.load();

      // Tunggu audio ready sebelum play
      correctAudioRef.current.oncanplaythrough = async () => {
        try {
          await correctAudioRef.current?.play();
          console.log('✅ Audio berhasil diputar');
        } catch (playErr) {
          console.error('❌ Gagal play:', playErr);
          toastError('Gagal memutar audio. Coba Qari lain.');
          setIsPlayingCorrect(false);
        }
      };

      correctAudioRef.current.onerror = (e) => {
        console.error('❌ Audio error:', e, 'URL:', audioUrl);

        // Coba URL fallback (AlQuran Cloud CDN)
        const fallbackUrl = `https://cdn.islamic.network/quran/audio/128/${selectedQari}/${getGlobalAyahNumber(surahNum, ayahNum)}.mp3`;
        console.log('🔄 Mencoba fallback URL:', fallbackUrl);

        if (correctAudioRef.current) {
          correctAudioRef.current.src = fallbackUrl;
          correctAudioRef.current.load();
          correctAudioRef.current.play().catch(() => {
            toastError('Audio tidak tersedia untuk ayat ini');
            setIsPlayingCorrect(false);
          });
        }
      };

      correctAudioRef.current.onended = () => {
        setIsPlayingCorrect(false);
      };

    } catch (err) {
      console.error('Error playing audio:', err);
      toastError('Gagal memutar audio');
      setIsPlayingCorrect(false);
    }
  };

  // Helper: Hitung nomor ayat global (untuk fallback URL)
  const getGlobalAyahNumber = (surahNum: number, ayahNum: number): number => {
    // Total ayat per surah (simplified - surah 1-10)
    const ayatPerSurah = [0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109];
    let total = 0;
    for (let i = 1; i < surahNum; i++) {
      total += ayatPerSurah[i] || 0;
    }
    return total + ayahNum;
  };

  const stopCorrectRecitation = () => {
    if (correctAudioRef.current) {
      correctAudioRef.current.pause();
      correctAudioRef.current.currentTime = 0;
      setIsPlayingCorrect(false);
    }
  };

  // ========== MODAL DENGAN AUDIO ==========
  const showModal = async (ruleKey: string, ayahNum: number) => {
    const materi: Record<string, any> = {
      idzhar: { title: 'Izhar Halqi', arabic: 'مَنْ ءَامَنَ', explanation: 'Nun sukun bertemu huruf halqi (ء ه ع ح غ خ), dibaca jelas tanpa dengung.', tips: 'Baca dengan jelas, langsung ke huruf berikutnya.' },
      ikhfa: { title: 'Ikhfa Haqiqi', arabic: 'مَنْ كَفَرَ', explanation: 'Nun sukun bertemu 15 huruf ikhfa, dibaca samar dengan dengung.', tips: 'Ucapkan samar seperti "ng", tahan dengung 2-3 harakat.' },
      idgham_bighunnah: { title: 'Idgham Bighunnah', arabic: 'مِنْ نِعْمَةٍ', explanation: 'Nun sukun dilebur ke huruf berikutnya dengan dengung.', tips: 'Langsung ke huruf berikutnya, tahan dengung 2 harakat.' },
      idgham_bilaghunnah: { title: 'Idgham Bilaghunnah', arabic: 'مِنْ رَبِّكَ', explanation: 'Nun sukun dilebur tanpa dengung.', tips: 'Langsung ke huruf berikutnya, tanpa dengung.' },
      iqlab: { title: 'Iqlab', arabic: 'أَنْبِئْهُم', explanation: 'Nun sukun berubah jadi mim dengan dengung.', tips: 'Rapatkan kedua bibir seperti "m", tahan dengung 2 harakat.' },
      qalqalah: { title: 'Qalqalah', arabic: 'يَلْبِسُونَ', explanation: 'Huruf ق ط ب ج د dipantulkan suaranya.', tips: 'Rasakan pantulan ringan.' },
      mad: { title: 'Mad Thabi\'i', arabic: 'قَالَ', explanation: 'Dibaca panjang 2 harakat.', tips: 'Tahan bacaan selama 2 ketukan.' }
    };
    const m = materi[ruleKey] || materi.idzhar;
    setModalContent({ ...m, ayahNum });
    setModalOpen(true);

    setTimeout(() => {
      playCorrectRecitation(currentSurahId, ayahNum);
    }, 300);
  };

  const closeModal = () => {
    setModalOpen(false);
    stopCorrectRecitation();
  };

  // ========== INLINE CORRECTIONS ==========
  const getInlineCorrections = (ayahNum: number) => {
    const errors = tajwidResults.filter(r => {
      const num = parseInt(r.ayah?.replace('Ayat ', '') || '0');
      return num === ayahNum && r.status !== 'correct';
    });

    if (errors.length === 0) return null;

    return (
      <div className="ayat-correction" style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.8rem', background: 'rgba(212,175,55,0.1)', borderLeft: '3px solid #D4AF37' }}>
        <div className="inline-correction-header" style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#D4AF37' }}>⚠️ Koreksi Tajwid</div>
        {errors.map((e, i) => {
          let ruleKey = (e.rule || '').toLowerCase().replace(/ /g, '_');
          if (ruleKey.includes('idzhar')) ruleKey = 'idzhar';
          else if (ruleKey.includes('ikhfa')) ruleKey = 'ikhfa';
          else if (ruleKey.includes('idgham_bighunnah')) ruleKey = 'idgham_bighunnah';
          else if (ruleKey.includes('idgham_bilaghunnah')) ruleKey = 'idgham_bilaghunnah';
          else if (ruleKey.includes('iqlab')) ruleKey = 'iqlab';
          else if (ruleKey.includes('qalqalah')) ruleKey = 'qalqalah';
          else if (ruleKey.includes('mad')) ruleKey = 'mad';
          else ruleKey = 'idzhar';

          return (
            <div key={i} className="inline-correction-item" style={{ marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  {e.status === 'correct' ? '✅' : e.status === 'warning' ? '⚠️' : '❌'} <strong>{e.rule}</strong> pada kata <span style={{ fontFamily: 'Amiri', background: 'rgba(212,175,55,0.2)', padding: '0.1rem 0.3rem', borderRadius: '0.3rem' }}>{e.matched_text || '-'}</span>
                </div>
                {e.status !== 'correct' && (
                  <button
                    className="btn-example-audio"
                    onClick={() => showModal(ruleKey, parseInt(e.ayah?.replace('Ayat ', '') || '1'))}
                    style={{
                      background: 'rgba(212,175,55,0.2)',
                      border: '1px solid #D4AF37',
                      borderRadius: '2rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    📖 Dengar Cara Baca
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{e.message}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: '#0D1B2A' }}>
      <div ref={containerRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Modal dengan Audio */}
      {modalOpen && modalContent && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl max-w-md w-full mx-4" style={{ background: 'rgba(15,25,35,0.95)', border: '3px solid #D4AF37' }}>
            <div className="flex justify-between items-center p-4 border-b border-[rgba(212,175,55,0.3)]">
              <h3 className="text-xl font-bold text-[#D4AF37]">📖 {modalContent.title}</h3>
              <button onClick={closeModal} className="text-2xl text-white hover:text-red-500">&times;</button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="text-xs text-[#8B9DAF] mb-1 block">Pilih Qari:</label>
                <select
                  value={selectedQari}
                  onChange={(e) => setSelectedQari(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[rgba(0,0,0,0.6)] border border-[rgba(212,175,55,0.5)] text-white text-sm"
                >
                  {QARI_OPTIONS.map((qari) => (
                    <option key={qari.id} value={qari.id}>
                      {qari.name} ({qari.country})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center font-arabic text-3xl mb-4">{modalContent.arabic}</div>
              <div className="bg-[rgba(212,175,55,0.1)] p-3 rounded-lg mb-3 border-l-3 border-[#D4AF37]">
                <strong>📖 Penjelasan:</strong> <br />{modalContent.explanation}
              </div>
              <div className="bg-[rgba(74,222,128,0.1)] p-3 rounded-lg mb-4">
                <strong>💡 Tips Membaca:</strong> <br />{modalContent.tips}
              </div>
              <button
                onClick={() => {
                  if (isPlayingCorrect) {
                    stopCorrectRecitation();
                  } else {
                    playCorrectRecitation(currentSurahId, modalContent.ayahNum);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                style={{
                  background: isPlayingCorrect ? 'rgba(74,222,128,0.3)' : 'rgba(212,175,55,0.3)',
                  color: isPlayingCorrect ? '#4ADE80' : '#D4AF37',
                  border: `2px solid ${isPlayingCorrect ? '#4ADE80' : '#D4AF37'}`
                }}
              >
                {isPlayingCorrect ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memutar Audio...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dengar Cara Baca yang Benar
                  </>
                )}
              </button>
            </div>
            <div className="p-4 border-t border-[rgba(212,175,55,0.3)] text-center">
              <button onClick={closeModal} className="bg-[#D4AF37] text-black font-bold px-6 py-2 rounded-full">
                Mengerti, terima kasih
              </button>
            </div>
          </div>
        </div>
      )}

      <audio ref={correctAudioRef} className="hidden" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[rgba(13,27,42,0.95)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] h-16 flex items-center px-5">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.05)]">
          <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
        </button>
        <h1 className="text-lg font-bold ml-3" style={{ color: '#E8DCC4' }}>Koreksi Bacaan</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-24 pb-32 relative z-10">
        {/* Dropdown Surat */}
        <div className="glass-card p-5 mb-6" style={{ background: 'rgba(15,25,35,0.7)', backdropFilter: 'blur(12px)', borderRadius: '1.8rem', border: '1px solid rgba(212,175,55,0.25)' }}>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#E8DCC4' }}>📖 Pilih Surat</label>
          <select
            className="w-full p-3 rounded-xl bg-[rgba(0,0,0,0.6)] border border-[rgba(212,175,55,0.5)] text-white"
            value={currentSurahId}
            onChange={(e) => {
              setCurrentSurahId(parseInt(e.target.value));
              fetchAyat(parseInt(e.target.value));
            }}
          >
            {surahList.map(s => (
              <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.total_verses || '?'} ayat)</option>
            ))}
          </select>
        </div>

        {/* Teks Quran */}
        <div className="glass-card p-5 mb-6" style={{ background: 'rgba(15,25,35,0.7)', backdropFilter: 'blur(12px)', borderRadius: '1.8rem', border: '1px solid rgba(212,175,55,0.25)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-l-3 border-[#D4AF37] pl-3" style={{ color: '#E8DCC4' }}>
            <i className="fas fa-text-height"></i> Teks Quran
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ayats.map((ayat, idx) => (
              <div key={idx} id={`ayat-card-${ayat.nomor}`} className="p-4 rounded-xl" style={{ background: 'rgba(5,12,22,0.7)' }}>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-[rgba(212,175,55,0.2)]">
                  <span className="w-7 h-7 rounded-full bg-[rgba(212,175,55,0.25)] text-[#D4AF37] text-xs font-bold flex items-center justify-center border border-[#D4AF37]">{ayat.nomor}</span>
                </div>
                <p className="font-arabic text-right text-xl leading-loose" style={{ color: '#f5e6c4' }}>{ayat.teks_arab}</p>
                <p className="text-sm mt-2" style={{ color: '#ccc' }}>{ayat.transliterasi}</p>
                {getInlineCorrections(ayat.nomor)}
              </div>
            ))}
          </div>
        </div>

        {/* Rekam Area */}
        <div className="glass-card p-5 mb-6" style={{ background: 'rgba(15,25,35,0.7)', backdropFilter: 'blur(12px)', borderRadius: '1.8rem', border: '1px solid rgba(212,175,55,0.25)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-l-3 border-[#D4AF37] pl-3" style={{ color: '#E8DCC4' }}>
            <i className="fas fa-microphone"></i> Rekam / Upload Bacaan
          </h3>

          <div className="flex gap-3 mb-4">
            <button
              onClick={startRecording}
              disabled={recording}
              className="flex-1 bg-red-500 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mic size={18} /> Mulai Rekam
            </button>
            <button
              onClick={stopRecording}
              disabled={!recording}
              className="flex-1 bg-gray-600 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Square size={18} /> Hentikan
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <label className="flex-1 bg-[rgba(30,40,55,0.9)] border border-[#D4AF37] text-[#D4AF37] font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={18} /> Upload Audio
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setRecordedBlob(e.target.files[0]);
                  if (audioRef.current) {
                    audioRef.current.src = URL.createObjectURL(e.target.files[0]);
                    audioRef.current.style.display = 'block';
                  }
                  setStatusText('📁 File siap! Klik Analisis');
                }
              }} />
            </label>
          </div>

          <div className="text-sm text-center mb-3" style={{ color: '#8B9DAF' }}>{statusText}</div>
          <audio ref={audioRef} controls className="w-full hidden" />

          <button
            onClick={analyzeAudio}
            disabled={processing}
            className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? '⏳ Menganalisis...' : '🚀 Analisis Tajwid'}
          </button>
        </div>

        {/* Hasil Analisis */}
        {(accuracy > 0 || tajwidResults.length > 0) && (
          <div className="glass-card p-5" style={{ background: 'rgba(15,25,35,0.7)', backdropFilter: 'blur(12px)', borderRadius: '1.8rem', border: '1px solid rgba(212,175,55,0.25)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-l-3 border-[#D4AF37] pl-3" style={{ color: '#E8DCC4' }}>
              <i className="fas fa-check-double"></i> Hasil Koreksi Tajwid
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-[rgba(0,0,0,0.5)]">
                <div className="text-2xl font-bold text-[#D4AF37]">{accuracy}%</div>
                <div className="text-xs">Akurasi</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-[rgba(0,0,0,0.5)]">
                <div className="text-2xl font-bold text-green-500">{correctCount}</div>
                <div className="text-xs">Benar</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-[rgba(0,0,0,0.5)]">
                <div className="text-2xl font-bold text-red-500">{wrongCount}</div>
                <div className="text-xs">Salah</div>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tajwidResults.filter(r => r.status !== 'correct').slice(0, 10).map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-[rgba(0,0,0,0.3)] border-l-3" style={{ borderLeftColor: r.status === 'warning' ? '#fbbf24' : '#f87171' }}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span><strong>{r.rule}</strong> - {r.matched_text}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[rgba(0,0,0,0.5)]">{r.score}%</span>
                  </div>
                  <div className="text-sm mt-1">{r.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Class Join Prompt Modal */}
      {showJoinPrompt && (
        <ClassJoinPrompt
          userId={localStorage.getItem('ngaji_user_id') || 'unknown'}
          onClose={() => setShowJoinPrompt(false)}
          onSuccess={() => {
            setShowJoinPrompt(false);
            setStatusText('🏫 Berhasil bergabung ke kelas! Sesi ini sudah tercatat untuk gurumu.');
          }}
        />
      )}
    </div>
  );
}