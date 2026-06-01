import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Target, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import gsap from 'gsap';

const surahList = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', score: 92, sessions: 8 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', score: 88, sessions: 6 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', score: 75, sessions: 5 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', score: 70, sessions: 4 },
  { number: 108, name: 'Al-Kautsar', arabic: 'الكوثر', score: 65, sessions: 1 },
];

const weeklyData = [
  { day: 'Sen', sessions: 2 },
  { day: 'Sel', sessions: 3 },
  { day: 'Rab', sessions: 1 },
  { day: 'Kam', sessions: 0 },
  { day: 'Jum', sessions: 4 },
  { day: 'Sab', sessions: 2 },
  { day: 'Min', sessions: 1 },
];

export default function ProgressDetail() {
  const navigate = useNavigate();
  const [mascotMessage, setMascotMessage] = useState('');
  const barsRef = useRef<HTMLDivElement[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);

  useEffect(() => {
    const totalSessions = weeklyData.reduce((s, d) => s + d.sessions, 0);
    if (totalSessions >= 10) {
      handleMascotMessage('Luar biasa! Kamu konsisten minggu ini! Pertahankan!');
    } else {
      handleMascotMessage('Ayo mulai lagi hari ini, setiap langkah itu berarti!');
    }
  }, [handleMascotMessage]);

  useEffect(() => {
    const maxSessions = Math.max(...weeklyData.map(d => d.sessions));
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        const h = maxSessions > 0 ? (weeklyData[i].sessions / maxSessions) * 100 : 0;
        gsap.to(bar, {
          height: `${Math.max(h, 8)}%`,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.3 + i * 0.08,
        });
      }
    });

    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.surah-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#D4AF37';
    if (score >= 60) return '#FBBF24';
    return '#F87171';
  };

  return (
    <div className="min-h-screen pb-56 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      <header
        className="sticky top-0 z-50 px-5 sm:px-8 h-16 sm:h-[72px] flex items-center gap-3"
        style={{
          background: 'rgba(13,27,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#E8DCC4' }}>
          Progress Belajar
        </h1>
      </header>

      <main className="app-container pt-4 sm:pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Trophy size={20} className="lg:w-6 lg:h-6" style={{ color: '#D4AF37', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold gold-text-gradient">78%</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Rata-rata</div>
          </div>
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Target size={20} className="lg:w-6 lg:h-6" style={{ color: '#4ADE80', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: '#4ADE80' }}>5</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Surat</div>
          </div>
          <div className="glass-card p-4 sm:p-5 lg:p-6 text-center">
            <Flame size={20} className="lg:w-6 lg:h-6" style={{ color: '#FBBF24', margin: '0 auto 6px' }} />
            <div className="text-lg sm:text-xl lg:text-2xl font-bold fire-gradient">3</div>
            <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Hari</div>
          </div>
        </div>

        {/* Desktop Layout: Chart + List side by side */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Weekly Activity Chart */}
          <div className="glass-card p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-0">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: '#E8DCC4' }}>
              Aktivitas Minggu Ini
            </h3>
            <div className="flex items-end justify-between h-32 sm:h-40 gap-2 sm:gap-3">
              {weeklyData.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    ref={(el) => { if (el) barsRef.current[i] = el; }}
                    className="w-full rounded-lg"
                    style={{
                      background: d.sessions > 0
                        ? 'linear-gradient(180deg, #D4AF37 0%, #D4AF3760 100%)'
                        : '#2A3F54',
                      height: '8%',
                      minHeight: d.sessions === 0 ? 4 : 8,
                      transition: 'none',
                    }}
                  />
                  <span className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Surah List */}
          <div ref={listRef}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#E8DCC4' }}>
              Surat yang Dipelajari
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {surahList.map((surah) => {
                const color = getScoreColor(surah.score);
                return (
                  <div
                    key={surah.number}
                    className="surah-item glass-card p-4 sm:p-5 flex items-center gap-4 sm:gap-5 glass-card-hover cursor-pointer"
                    onMouseEnter={() => handleMascotMessage(`Surat ${surah.name} — skor ${surah.score}%, ${surah.sessions} sesi latihan!`)}
                  >
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}15` }}
                    >
                      <span className="font-arabic text-lg sm:text-xl" style={{ color }}>
                        {surah.arabic}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-semibold" style={{ color: '#E8DCC4' }}>
                        {surah.name}
                      </div>
                      <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>
                        {surah.sessions} sesi latihan
                      </div>
                    </div>
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${color}15`,
                        border: `2px solid ${color}40`,
                      }}
                    >
                      <span className="text-sm sm:text-base font-bold" style={{ color }}>
                        {surah.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}
