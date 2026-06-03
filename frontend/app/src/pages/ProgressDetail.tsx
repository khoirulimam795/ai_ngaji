// src/pages/ProgressDetail.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Target, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import { useStats } from '@/hooks/useStats';
import { useUser } from '@/hooks/useUser';
import gsap from 'gsap';

// Helper: hitung streak dari history (hari berturut-turut berdasarkan created_at)
const calculateStreak = (history: any[]): number => {
  if (!history.length) return 0;
  const dates = history.map(h => new Date(h.created_at).toDateString());
  const uniqueDates = [...new Set(dates)].sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  const today = new Date().toDateString();
  let expectedDate = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]).toDateString();
    if (i === 0 && currentDate !== today) break;
    if (currentDate === expectedDate.toDateString()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else break;
  }
  return streak;
};

// Helper: kelompokkan sesi per hari untuk chart mingguan
const getWeeklyActivity = (history: any[]) => {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // mulai Minggu
  const weeklyMap: Record<string, number> = {};
  days.forEach(day => { weeklyMap[day] = 0; });
  
  history.forEach(session => {
    const sessionDate = new Date(session.created_at);
    if (sessionDate >= startOfWeek) {
      const dayName = days[sessionDate.getDay()];
      weeklyMap[dayName] += 1;
    }
  });
  
  return days.map(day => ({ day, sessions: weeklyMap[day] }));
};

// Helper: ambil daftar surat unik dari history dengan skor rata-rata / tertinggi
const getUniqueSurahs = (history: any[]) => {
  const surahMap = new Map();
  history.forEach(session => {
    const num = session.surah;
    const name = session.surah_name || `Surah ${num}`;
    const arabic = getArabicName(num); // function sederhana (bisa diperluas)
    const score = session.accuracy;
    if (!surahMap.has(num)) {
      surahMap.set(num, { number: num, name, arabic, score, sessions: 1, totalScore: score });
    } else {
      const existing = surahMap.get(num);
      existing.sessions++;
      existing.totalScore += score;
      existing.score = Math.round(existing.totalScore / existing.sessions);
      surahMap.set(num, existing);
    }
  });
  return Array.from(surahMap.values()).sort((a,b) => b.score - a.score);
};

// Daftar nama Arab sederhana (bisa dari file JSON atau hardcoded untuk demo)
const getArabicName = (surahNum: number): string => {
  const names: Record<number, string> = {
    1: 'الفاتحة',
    78: 'النبأ', 79: 'النازعات', 80: 'عبس', 81: 'التكوير', 82: 'الانفطار',
    83: 'المطففين', 84: 'الانشقاق', 85: 'البروج', 86: 'الطارق', 87: 'الأعلى',
    88: 'الغاشية', 89: 'الفجر', 90: 'البلد', 91: 'الشمس', 92: 'الليل',
    93: 'الضحى', 94: 'الشرح', 95: 'التين', 96: 'العلق', 97: 'القدر',
    98: 'البينة', 99: 'الزلزلة', 100: 'العاديات', 101: 'القارعة', 102: 'التكاثر',
    103: 'العصر', 104: 'الهمزة', 105: 'الفيل', 106: 'قريش', 107: 'الماعون',
    108: 'الكوثر', 109: 'الكافرون', 110: 'النصر', 111: 'المسد', 112: 'الإخلاص',
    113: 'الفلق', 114: 'الناس'
  };
  return names[surahNum] || '';
};

export default function ProgressDetail() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { stats, history, loading } = useStats(user?.id);
  const [mascotMessage, setMascotMessage] = useState('');
  const barsRef = useRef<HTMLDivElement[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);

  // Siapkan data untuk tampilan
  const avgAccuracy = stats?.avg_accuracy ?? 0;
  const totalSessions = stats?.total_sessions ?? 0;
  const uniqueSurahs = history.length ? getUniqueSurahs(history) : [];
  const streak = calculateStreak(history);
  const weeklyActivity = getWeeklyActivity(history);

  useEffect(() => {
    if (!loading && history.length) {
      const totalSessionsWeek = weeklyActivity.reduce((s, d) => s + d.sessions, 0);
      if (totalSessionsWeek >= 10) {
        handleMascotMessage('Luar biasa! Kamu konsisten minggu ini! Pertahankan!');
      } else if (totalSessionsWeek > 0) {
        handleMascotMessage('Ayo mulai lagi hari ini, setiap langkah itu berarti!');
      } else {
        handleMascotMessage('Belum ada aktivitas minggu ini. Yuk mulai ngaji!');
      }
    } else if (!loading && !history.length) {
      handleMascotMessage('Belum ada sesi ngaji. Mulai rekam bacaanmu!');
    }
  }, [loading, history]);

  useEffect(() => {
    if (!loading && weeklyActivity.length) {
      const maxSessions = Math.max(...weeklyActivity.map(d => d.sessions), 1);
      barsRef.current.forEach((bar, i) => {
        if (bar) {
          const h = (weeklyActivity[i].sessions / maxSessions) * 100;
          gsap.to(bar, {
            height: `${Math.max(h, 8)}%`,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.3 + i * 0.08,
          });
        }
      });
    }
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.surah-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, [loading, weeklyActivity, uniqueSurahs]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#D4AF37';
    if (score >= 60) return '#FBBF24';
    return '#F87171';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-[#D4AF37] border-r-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#E8DCC4]">Memuat data progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-56 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      <header className="sticky top-0 z-50 px-5 sm:px-8 h-16 sm:h-[72px] flex items-center gap-3" style={{ background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#E8DCC4' }}>Progress Belajar</h1>
      </header>

      <main className="app-container pt-4 sm:pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Trophy size={20} className="lg:w-6 lg:h-6" style={{ color: '#D4AF37', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold gold-text-gradient">{avgAccuracy}%</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Rata-rata</div>
          </div>
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Target size={20} className="lg:w-6 lg:h-6" style={{ color: '#4ADE80', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: '#4ADE80' }}>{uniqueSurahs.length}</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Surat</div>
          </div>
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Flame size={20} className="lg:w-6 lg:h-6" style={{ color: '#FBBF24', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold fire-gradient">{streak}</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Hari</div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Weekly Activity Chart */}
          <div className="glass-card p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-0">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#E8DCC4' }}>Aktivitas Minggu Ini</h3>
            <div className="flex items-end justify-between h-32 sm:h-40 gap-2 sm:gap-3">
              {weeklyActivity.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    ref={(el) => { if (el) barsRef.current[i] = el; }}
                    className="w-full rounded-lg"
                    style={{
                      background: d.sessions > 0 ? 'linear-gradient(180deg, #D4AF37 0%, #D4AF3760 100%)' : '#2A3F54',
                      height: '8%',
                      minHeight: d.sessions === 0 ? 4 : 8,
                      transition: 'none',
                    }}
                  />
                  <span className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>{d.day}</span>
                </div>
              ))}
            </div>
            {weeklyActivity.every(d => d.sessions === 0) && (
              <p className="text-center text-xs mt-4" style={{ color: '#6B7F8F' }}>Belum ada aktivitas minggu ini. Rekam bacaanmu!</p>
            )}
          </div>

          {/* Surah List */}
          <div ref={listRef}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#E8DCC4' }}>Surat yang Dipelajari</h3>
            {uniqueSurahs.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <p style={{ color: '#8B9DAF' }}>Belum ada sesi rekaman. Yuk mulai belajar!</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {uniqueSurahs.map((surah) => {
                  const color = getScoreColor(surah.score);
                  return (
                    <div
                      key={surah.number}
                      className="surah-item glass-card p-4 sm:p-5 flex items-center gap-4 sm:gap-5 glass-card-hover cursor-pointer"
                      onMouseEnter={() => handleMascotMessage(`Surat ${surah.name} — skor ${surah.score}%, ${surah.sessions} sesi latihan!`)}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                        <span className="font-arabic text-lg sm:text-xl" style={{ color }}>{surah.arabic}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-semibold" style={{ color: '#E8DCC4' }}>{surah.name}</div>
                        <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>{surah.sessions} sesi latihan</div>
                      </div>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `2px solid ${color}40` }}>
                        <span className="text-sm sm:text-base font-bold" style={{ color }}>{surah.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}