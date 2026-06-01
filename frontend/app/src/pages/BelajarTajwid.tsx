import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import gsap from 'gsap';

// ========== DATA KATEGORI ==========
const categories = [
  {
    id: 'nun_sukun',
    name: 'Nun Sukun & Tanwin',
    icon: '🌙',
    color: '#4ADE80',
    description: 'Pelajari hukum bacaan nun mati dan tanwin',
    bgGradient: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(74,222,128,0.05) 100%)'
  },
  {
    id: 'mad',
    name: 'Mad (Panjang)',
    icon: '📏',
    color: '#FBBF24',
    description: 'Pelajari hukum bacaan panjang',
    bgGradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)'
  },
  {
    id: 'qalqalah',
    name: 'Qalqalah',
    icon: '⚡',
    color: '#D4AF37',
    description: 'Pelajari hukum bacaan pantul',
    bgGradient: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)'
  }
];

// ========== MATERI NUN SUKUN ==========
const nunSukunRules = [
  {
    name: 'Idzhar Halqi',
    color: '#4ADE80',
    description: 'Nun sukun atau tanwin bertemu huruf halqi (tenggorokan), dibaca jelas tanpa dengung.',
    example: 'مِنْ أَمْرٍ',
    exampleLatin: 'min amrin',
    letters: 'ء, ه, ع, ح, غ, خ',
    detail: 'Huruf halqi ada 6: ء (hamzah), ه (ha), ع (ain), ح (ha), غ (ghain), خ (kho).'
  },
  {
    name: 'Idgham Bighunnah',
    color: '#7F77DD',
    description: 'Nun sukun atau tanwin dimasukkan ke huruf berikutnya dengan dengung (ghunnah).',
    example: 'مِنْ نِعْمَةٍ',
    exampleLatin: 'min ni\'mah',
    letters: 'ي, ن, م, و',
    detail: 'Huruf idgham bighunnah ada 4: ي (ya), ن (nun), م (mim), و (wau).'
  },
  {
    name: 'Idgham Bilaghunnah',
    color: '#60A5FA',
    description: 'Nun sukun atau tanwin dimasukkan ke huruf berikutnya tanpa dengung.',
    example: 'مِنْ رَبِّهِمْ',
    exampleLatin: 'min rabbihim',
    letters: 'ل, ر',
    detail: 'Hanya terjadi pada 2 huruf: ل (lam) dan ر (ra).'
  },
  {
    name: 'Iqlab',
    color: '#F472B6',
    description: 'Nun sukun atau tanwin berubah menjadi mim (م) dengan dengung.',
    example: 'مِنْ بَعْدِ',
    exampleLatin: 'min ba\'di',
    letters: 'ب',
    detail: 'Hanya terjadi pada 1 huruf: ب (ba).'
  },
  {
    name: 'Ikhfa Haqiqi',
    color: '#FBBF24',
    description: 'Nun sukun atau tanwin dibaca samar antara idzhar dan idgham dengan dengung.',
    example: 'مِنْ قَبْلُ',
    exampleLatin: 'min qablu',
    letters: 'ت, ث, ج, د, ذ, ز, س, ش, ص, ض, ط, ظ, ف, ق, ك',
    detail: '15 huruf ikhfa: ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك'
  }
];

// ========== MATERI MAD ==========
const madRules = [
  {
    name: 'Mad Thabi\'i (Mad Asli)',
    color: '#FBBF24',
    description: 'Mad yang terjadi karena huruf alif, wau, atau ya yang tidak bertemu hamzah atau sukun. Dibaca panjang 2 harakat.',
    example: 'قَالَ',
    exampleLatin: 'qaala',
    letters: 'ا, و, ي',
    detail: 'Contoh: قَالَ (qaala), يَقُولُ (yaquulu), بِسْمِ (bismi).'
  },
  {
    name: 'Mad Wajib Muttasil',
    color: '#F97316',
    description: 'Mad yang bertemu hamzah dalam satu kata. Dibaca panjang 4-5 harakat.',
    example: 'جَاءَ',
    exampleLatin: 'jaa-a',
    letters: 'ا + ء',
    detail: 'Contoh: جَاءَ (jaa-a), السَّمَاءُ (as-samaa-u).'
  },
  {
    name: 'Mad Jaiz Munfashil',
    color: '#EAB308',
    description: 'Mad yang bertemu hamzah di kata berbeda. Dibaca panjang 2-5 harakat.',
    example: 'فِي أَنْفُسِهِمْ',
    exampleLatin: 'fii anfusihim',
    letters: 'ي + أ',
    detail: 'Boleh dipanjangkan 2, 4, atau 5 harakat.'
  },
  {
    name: 'Mad Lazim Kilmi',
    color: '#EF4444',
    description: 'Mad yang terjadi karena huruf mad diikuti sukun asli. Dibaca panjang 6 harakat.',
    example: 'الضَّالِّينَ',
    exampleLatin: 'ad-dhaalliin',
    letters: 'ا + ل',
    detail: 'Wajib dibaca panjang 6 harakat, tidak boleh kurang.'
  },
  {
    name: 'Mad \'Arid Lissukun',
    color: '#F59E0B',
    description: 'Mad yang terjadi karena waqaf (berhenti) pada huruf mad.',
    example: 'الْعَالَمِينَ',
    exampleLatin: 'al-alamiin',
    letters: 'ي + ن',
    detail: 'Dibaca 2, 4, atau 6 harakat ketika waqaf.'
  }
];

// ========== MATERI QALQALAH ==========
const qalqalahRules = [
  {
    name: 'Qalqalah Sughra',
    color: '#D4AF37',
    description: 'Qalqalah yang terjadi pada huruf qalqalah yang bersukun asli (ada harakat sukun).',
    example: 'اقْدُرْ',
    exampleLatin: 'iqdur',
    letters: 'ق, ط, ب, ج, د',
    detail: 'Pantulan suara lebih ringan, dibaca dengan getaran kecil.'
  },
  {
    name: 'Qalqalah Kubra',
    color: '#F59E0B',
    description: 'Qalqalah yang terjadi karena waqaf (berhenti) pada huruf qalqalah.',
    example: 'الْفَلَقِ',
    exampleLatin: 'al-falaqi',
    letters: 'ق, ط, ب, ج, د',
    detail: 'Pantulan suara lebih kuat ketika berhenti di akhir ayat.'
  }
];

// ========== MAP KATEGORI KE MATERI ==========
const categoryMaterials: Record<string, any[]> = {
  nun_sukun: nunSukunRules,
  mad: madRules,
  qalqalah: qalqalahRules
};

// ========== FUNGSI TEXT TO SPEECH (FALLBACK) ==========
let speechSynth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

const speakText = (text: string, language: string = 'ar-SA') => {
  if (currentUtterance) {
    speechSynth?.cancel();
  }

  if (!speechSynth) {
    speechSynth = window.speechSynthesis;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  currentUtterance = utterance;
  speechSynth.speak(utterance);
};

const speakArabic = (arabicText: string) => {
  speakText(arabicText, 'ar-SA');
};

export default function BelajarTajwid() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mascotMessage, setMascotMessage] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const materialsRef = useRef<HTMLDivElement>(null);

  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);

  // Mapping file audio
  const getAudioFile = (ruleName: string): string => {
    const audioMap: Record<string, string> = {
      'Idzhar Halqi': '/audio/idzhar1.wav',
      'Idgham Bighunnah': '/audio/idgham_bighunnah.mp3',
      'Idgham Bilaghunnah': '/audio/idgham_bilaghunnah.mp3',
      'Iqlab': '/audio/iqlab.mp3',
      'Ikhfa Haqiqi': '/audio/ikhfa.mp3',
      'Mad Thabi\'i (Mad Asli)': '/audio/mad_thabii.mp3',
      'Mad Wajib Muttasil': '/audio/mad_wajib.mp3',
      'Mad Jaiz Munfashil': '/audio/mad_jaiz.mp3',
      'Mad Lazim Kilmi': '/audio/mad_lazim.mp3',
      'Mad \'Arid Lissukun': '/audio/mad_arid.mp3',
      'Qalqalah Sughra': '/audio/qalqalah_sughra.mp3',
      'Qalqalah Kubra': '/audio/qalqalah_kubra.mp3',
    };
    return audioMap[ruleName] || '';
  };

  // Animasi untuk kategori
  useEffect(() => {
    if (categoryRef.current && !selectedCategory) {
      const cards = categoryRef.current.querySelectorAll('.category-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.3 }
      );
    }
  }, [selectedCategory]);

  // Animasi untuk materi
  useEffect(() => {
    if (materialsRef.current && selectedCategory) {
      const cards = materialsRef.current.querySelectorAll('.tajwid-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, [selectedCategory]);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(c => c.id === categoryId);
    handleMascotMessage(`Kamu pilih materi ${category?.name}! Pelajari satu per satu ya!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    handleMascotMessage('Pilih kategori hukum tajwid yang ingin kamu pelajari!');
  };

  const handlePlayAudio = (index: number, ruleName: string, arabicText: string) => {
    // Hentikan audio yang sedang berjalan
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    const audioFile = getAudioFile(ruleName);

    if (!audioFile) {
      // Fallback ke TTS
      speakArabic(arabicText);
      setPlayingIndex(index);
      setTimeout(() => setPlayingIndex(null), 2000);
      return;
    }

    const audio = new Audio(audioFile);
    setCurrentAudio(audio);
    setPlayingIndex(index);

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      speakArabic(arabicText);
    });

    audio.onended = () => {
      setPlayingIndex(null);
      setCurrentAudio(null);
    };
  };

  const currentMaterials = selectedCategory ? categoryMaterials[selectedCategory] : [];

  return (
    <div className="min-h-screen pb-56 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-5 sm:px-8 h-16 sm:h-[72px] flex items-center gap-3"
        style={{
          background: 'rgba(13,27,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {selectedCategory ? (
          <button
            onClick={handleBackToCategories}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#E8DCC4' }}>
          {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Belajar Tajwid'}
        </h1>
      </header>

      <main className="app-container pt-4 sm:pt-6">
        {!selectedCategory ? (
          <div ref={categoryRef}>
            <p className="text-sm sm:text-base mb-4 lg:mb-6" style={{ color: '#8B9DAF' }}>
              Pilih kategori hukum tajwid yang ingin kamu pelajari:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="category-card glass-card p-6 sm:p-8 glass-card-hover cursor-pointer text-center transition-all duration-300 hover:scale-105"
                  style={{
                    background: cat.bgGradient,
                    border: `1px solid ${cat.color}40`,
                  }}
                  onMouseEnter={() => handleMascotMessage(`Kategori ${cat.name}: ${cat.description}`)}
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${cat.color}20` }}
                  >
                    <span className="text-3xl sm:text-4xl">{cat.icon}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#E8DCC4' }}>
                    {cat.name}
                  </h3>
                  <p className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>
                    {cat.description}
                  </p>
                  <div
                    className="mt-4 w-full h-1 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cat.color}40, ${cat.color})` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div ref={materialsRef}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm sm:text-base" style={{ color: '#8B9DAF' }}>
                {currentMaterials.length} materi yang harus dipelajari:
              </p>
              <div
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}
              >
                Klik icon speaker untuk dengar contoh bacaan
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              {currentMaterials.map((rule, idx) => (
                <div
                  key={rule.name}
                  className="tajwid-card glass-card p-5 sm:p-6 glass-card-hover"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ borderLeft: `3px solid ${rule.color}` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${rule.color}20` }}
                    >
                      <span className="text-sm sm:text-base font-bold" style={{ color: rule.color }}>
                        {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold flex-1" style={{ color: '#E8DCC4' }}>
                      {rule.name}
                    </h3>
                    <button
                      onClick={() => handlePlayAudio(idx, rule.name, rule.example)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all duration-200"
                      style={{
                        background: playingIndex === idx ? `${rule.color}40` : 'rgba(255,255,255,0.05)',
                        animation: playingIndex === idx ? 'pulse 0.5s ease-in-out' : 'none'
                      }}
                    >
                      {playingIndex === idx ? (
                        <VolumeX size={16} style={{ color: rule.color }} />
                      ) : (
                        <Volume2 size={16} style={{ color: '#8B9DAF' }} />
                      )}
                    </button>
                  </div>

                  <p className="text-sm sm:text-base mb-3 leading-relaxed" style={{ color: '#8B9DAF' }}>
                    {rule.description}
                  </p>

                  <div
                    className="rounded-xl p-3 sm:p-4 mb-3 flex items-center justify-between flex-wrap gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <span className="font-arabic text-xl sm:text-2xl lg:text-[1.75rem]" style={{ color: '#F5E6C4' }}>
                      {rule.example}
                    </span>
                    <span className="text-xs italic" style={{ color: '#4A5D70' }}>
                      {rule.exampleLatin}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs sm:text-sm" style={{ color: '#4A5D70' }}>Huruf: </span>
                    <span className="font-arabic text-sm sm:text-base" style={{ color: rule.color }}>
                      {rule.letters}
                    </span>
                  </div>

                  <div
                    className="text-xs sm:text-sm p-3 rounded-lg mt-2"
                    style={{ background: `${rule.color}10`, borderLeft: `2px solid ${rule.color}` }}
                  >
                    <strong style={{ color: rule.color }}>📖 Penjelasan:</strong>{' '}
                    <span style={{ color: '#8B9DAF' }}>{rule.detail}</span>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      className="text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-colors hover:bg-white/5"
                      style={{ background: 'rgba(255,255,255,0.05)', color: rule.color }}
                      onClick={() => handleMascotMessage(`${rule.name}: ${rule.description}`)}
                    >
                      <Volume2 size={12} /> Baca Penjelasan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}