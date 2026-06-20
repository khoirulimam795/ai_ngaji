import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, Flame, BookOpen, AlertTriangle, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/useUser';
import { API_BASE, api } from '@/lib/api'; // Pastikan 'api' diimport untuk mark as read
import Skeleton from '@/components/Skeleton';

// Helper: Kelompokkan history berdasarkan Tanggal
const groupHistoryByDate = (history: any[]) => {
  const groups: Record<string, any[]> = {};
  history.forEach(session => {
    const dateObj = new Date(session.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let dateLabel = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (dateObj.toDateString() === today.toDateString()) dateLabel = 'Hari Ini';
    else if (dateObj.toDateString() === yesterday.toDateString()) dateLabel = 'Kemarin';

    if (!groups[dateLabel]) groups[dateLabel] = [];
    groups[dateLabel].push(session);
  });
  return groups;
};

// Helper: Highlight Ayat
const highlightAyat = (ayatText: string, errors: any[]) => {
  if (!errors || errors.length === 0) return ayatText;
  const wrongWords = errors.filter((e: any) => e.status !== 'correct').map((e: any) => e.matched_text).filter(Boolean);
  if (wrongWords.length === 0) return ayatText;

  let highlighted = ayatText;
  wrongWords.forEach((word: string) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedWord})`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-red-500 font-bold bg-red-500/20 px-1 rounded">${word}</span>`);
  });
  return highlighted;
};

export default function ProgressDetail() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mascotMessage, setMascotMessage] = useState('');

  const [tajwidModalOpen, setTajwidModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handleMascotMessage = useCallback((msg: string) => setMascotMessage(msg), []);

  // Fetch History
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`${API_BASE}/user/${user.id}/history?limit=100`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  // 🔥 AUTO MARK AS READ: Hilangkan badge merah saat halaman dibuka
  useEffect(() => {
    if (!loading && history && history.length > 0) {
      const unreadSessions = history.filter(h => h.teacher_comment && !h.comment_read_at);
      if (unreadSessions.length > 0) {
        unreadSessions.forEach(session => {
          api.markCommentRead(session.id.toString(), user?.id || '');
        });
      }
    }
  }, [loading, history, user?.id]);

  const openTajwidModal = (session: any) => {
    setSelectedSession(session);
    setTajwidModalOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#D4AF37';
    if (score >= 60) return '#FBBF24';
    return '#F87171';
  };

  const groupedHistory = groupHistoryByDate(history);

  if (loading) {
    return (
      <div className="min-h-screen pb-56 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
        <header className="sticky top-0 z-50 px-5 sm:px-8 h-16 sm:h-[72px] flex items-center gap-3" style={{ background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Skeleton variant="circular" width="40px" height="40px" />
          <Skeleton variant="text" width="150px" height="24px" />
        </header>

        <main className="app-container pt-4 sm:pt-6 max-w-3xl mx-auto">
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4">
                <Skeleton variant="circular" width="20px" height="20px" className="mx-auto mb-2" />
                <Skeleton variant="text" width="60%" height="20px" className="mx-auto mb-2" />
                <Skeleton variant="text" width="40%" height="12px" className="mx-auto" />
              </div>
            ))}
          </div>

          {/* History List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-4">
                <Skeleton variant="circular" width="48px" height="48px" />
                <div className="flex-1">
                  <Skeleton variant="text" width="60%" height="16px" className="mb-2" />
                  <Skeleton variant="text" width="40%" height="12px" />
                </div>
                <Skeleton variant="circular" width="40px" height="40px" />
              </div>
            ))}
          </div>
        </main>
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

      <main className="app-container pt-4 sm:pt-6 max-w-3xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <Trophy size={20} style={{ color: '#D4AF37', margin: '0 auto 6px' }} />
            <div className="text-lg font-bold" style={{ color: '#D4AF37' }}>{history.length > 0 ? Math.round(history.reduce((a, b) => a + b.accuracy, 0) / history.length) : 0}%</div>
            <div className="text-xs" style={{ color: '#8B9DAF' }}>Rata-rata</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Target size={20} style={{ color: '#4ADE80', margin: '0 auto 6px' }} />
            <div className="text-lg font-bold" style={{ color: '#4ADE80' }}>{new Set(history.map(h => h.surah)).size}</div>
            <div className="text-xs" style={{ color: '#8B9DAF' }}>Surat</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Flame size={20} style={{ color: '#FBBF24', margin: '0 auto 6px' }} />
            <div className="text-lg font-bold" style={{ color: '#FBBF24' }}>{history.length}</div>
            <div className="text-xs" style={{ color: '#8B9DAF' }}>Total Sesi</div>
          </div>
        </div>

        {/* Riwayat Dikelompokkan per Tanggal */}
        {history.length === 0 ? (
          <div className="glass-card p-6 text-center"><p style={{ color: '#8B9DAF' }}>Belum ada sesi rekaman. Yuk mulai belajar!</p></div>
        ) : (
          Object.entries(groupedHistory).map(([dateLabel, sessions]) => (
            <div key={dateLabel} className="mb-8">
              <h3 className="text-base font-semibold mb-3 px-2" style={{ color: '#E8DCC4' }}>{dateLabel}</h3>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const color = getScoreColor(session.accuracy);
                  const hasErrors = session.errors && session.errors.some((e: any) => e.status !== 'correct');
                  const isUnreadComment = session.teacher_comment && !session.comment_read_at;

                  return (
                    <div key={session.id} className="glass-card p-4 glass-card-hover">
                      {/* Header Sesi */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                          <span className="font-arabic text-lg" style={{ color }}>{session.surah_name?.substring(0, 3) || '...'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: '#E8DCC4' }}>{session.surah_name || `Surah ${session.surah}`}</div>
                          <div className="text-xs" style={{ color: '#8B9DAF' }}>{new Date(session.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Akurasi {session.accuracy}%</div>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `2px solid ${color}40` }}>
                          <span className="text-xs font-bold" style={{ color }}>{session.accuracy}</span>
                        </div>

                        {hasErrors && (
                          <button onClick={() => openTajwidModal(session)} className="ml-2 p-2 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] hover:bg-[#E74C3C]/20 transition" title="Lihat Kesalahan">
                            <BookOpen size={16} />
                          </button>
                        )}
                      </div>

                      {/*  CARD KOMENTAR GURU (DITAMBAHKAN DI SINI) */}
                      {session.teacher_comment && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div
                            className="p-3 rounded-xl flex items-start gap-3 transition-all duration-300"
                            style={{
                              background: isUnreadComment ? 'rgba(255, 249, 196, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                              borderLeft: `4px solid ${isUnreadComment ? '#FBBF24' : '#8B9DAF'}`
                            }}
                          >
                            <MessageCircle size={16} className={isUnreadComment ? 'text-[#FBBF24] mt-0.5' : 'text-[#8B9DAF] mt-0.5'} />
                            <div className="flex-1">
                              <p className="text-xs font-bold mb-1" style={{ color: isUnreadComment ? '#FBBF24' : '#8B9DAF' }}>
                                {isUnreadComment ? '✨ Pesan Baru dari Gurumu:' : 'Pesan dari Gurumu:'}
                              </p>
                              <p className="text-sm italic" style={{ color: '#E8DCC4' }}>
                                "{session.teacher_comment}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* MODAL KESALAHAN BACAAN SISWA */}
      {tajwidModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A2E] border border-[#E74C3C]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E74C3C]/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#E74C3C]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kesalahan Tajwid</h3>
                  <p className="text-xs text-[#8B9DAF]">{selectedSession.surah_name} • {new Date(selectedSession.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <button onClick={() => setTajwidModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-[#8B9DAF] hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {(() => {
                const errorsByAyat: Record<string, any[]> = {};
                selectedSession.errors.forEach((error: any) => {
                  if (error.status !== 'correct') {
                    const ayatKey = error.ayah || 'Ayat Tidak Diketahui';
                    if (!errorsByAyat[ayatKey]) errorsByAyat[ayatKey] = [];
                    errorsByAyat[ayatKey].push(error);
                  }
                });

                return Object.entries(errorsByAyat).map(([ayatKey, errors]) => {
                  const ayatText = errors[0]?.ayah_text || '';
                  const highlightedAyat = highlightAyat(ayatText, errors);

                  return (
                    <div key={ayatKey} className="bg-black/30 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded bg-[#E74C3C]/20 text-[#E74C3C] text-xs font-bold">{ayatKey}</span>
                      </div>
                      <div className="text-right font-arabic text-2xl leading-loose mb-4 p-4 bg-[#0D1B2A] rounded-lg border border-white/10" dangerouslySetInnerHTML={{ __html: highlightedAyat }} />
                      <div className="space-y-2">
                        {errors.map((error, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-[#E74C3C]/5 rounded-lg border-l-2 border-[#E74C3C]">
                            <AlertTriangle size={16} className="text-[#E74C3C] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-white">{error.rule}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E74C3C]/20 text-[#E74C3C]">Score: {error.score}%</span>
                              </div>
                              <p className="text-xs text-[#8B9DAF] mb-1">Kata: <span className="font-arabic text-sm text-white bg-white/10 px-2 py-0.5 rounded">{error.matched_text}</span></p>
                              <p className="text-xs text-[#F39C12]">{error.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}