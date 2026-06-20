import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, CheckCircle, AlertTriangle, X, BookOpen } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';
import { api } from '@/lib/api';
import CommentPanel from '@/components/CommentPanel';
import Skeleton from '@/components/Skeleton';

export default function StudentDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { teacher } = useTeacher();
  const [sessions, setSessions] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('Siswa');
  const [loading, setLoading] = useState(true);
  const [commentSessionId, setCommentSessionId] = useState<number | null>(null);

  // 🔥 State baru untuk modal kesalahan tajwid
  const [tajwidModalOpen, setTajwidModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    if (teacher?.classCode && userId) {
      api.getStudentSessions(teacher.classCode, userId, teacher.id).then(res => {
        setSessions(res.sessions || []);
        setStudentName(res.student_name || 'Siswa');
        setLoading(false);
      });
    }
  }, [teacher, userId]);

  const handleCommentSuccess = () => {
    setCommentSessionId(null);
    if (teacher?.classCode && userId) {
      api.getStudentSessions(teacher.classCode, userId, teacher.id).then(res => {
        setSessions(res.sessions || []);
        setStudentName(res.student_name || 'Siswa');
      });
    }
  };

  // 🔥 Buka modal kesalahan tajwid
  const openTajwidModal = (session: any) => {
    setSelectedSession(session);
    setTajwidModalOpen(true);
  };

  const closeTajwidModal = () => {
    setTajwidModalOpen(false);
    setSelectedSession(null);
  };

  // 🔥 Helper: Highlight kata yang salah dalam ayat
  const highlightAyat = (ayatText: string, errors: any[]) => {
    if (!errors || errors.length === 0) return ayatText;

    // Ambil semua kata yang salah
    const wrongWords = errors
      .filter((e: any) => e.status !== 'correct')
      .map((e: any) => e.matched_text)
      .filter(Boolean);

    if (wrongWords.length === 0) return ayatText;

    // Escape special regex characters dari teks Arab
    const escapedWords = wrongWords.map((word: string) =>
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    // Replace kata yang salah dengan span merah
    let highlighted = ayatText;
    escapedWords.forEach((word: string, idx: number) => {
      const regex = new RegExp(`(${word})`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-red-500 font-bold bg-red-500/20 px-1 rounded">${wrongWords[idx]}</span>`);
    });

    return highlighted;
  };

  // 🔥 Helper: Ringkas kesalahan tajwid
  const summarizeErrors = (errors: any[]) => {
    if (!errors || errors.length === 0) return null;
    const counts: Record<string, number> = {};
    errors.forEach((e: any) => {
      if (e.status !== 'correct') {
        const rule = e.rule || 'Lainnya';
        counts[rule] = (counts[rule] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([rule, count]) => `${rule} (${count})`).join(', ');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { bg: 'bg-[#2ECC71]/20', text: 'text-[#2ECC71]', label: 'Bagus!' };
    if (score >= 60) return { bg: 'bg-[#F39C12]/20', text: 'text-[#F39C12]', label: 'Cukup' };
    return { bg: 'bg-[#E74C3C]/20', text: 'text-[#E74C3C]', label: 'Perlu Perhatian' };
  };

  if (!teacher) return <div className="p-8 text-white">Redirecting...</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D1B2A]/90 backdrop-blur-md border-b border-white/10 px-5 h-16 flex items-center gap-3">
        <button onClick={() => navigate('/guru/dashboard')} className="p-2 rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} className="text-[#E8DCC4]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Detail Siswa</h1>
          <p className="text-xs text-[#4fff00]">{studentName}</p>
        </div>
      </header>

      <main className="p-5 max-w-3xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="text" width="200px" height="24px" className="mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Skeleton variant="text" width="150px" height="20px" className="mb-2" />
                    <Skeleton variant="text" width="100px" height="12px" />
                  </div>
                  <Skeleton variant="rectangular" width="80px" height="28px" />
                </div>
                <Skeleton variant="rectangular" width="100%" height="40px" className="mb-3" />
                <div className="flex gap-3">
                  <Skeleton variant="rectangular" width="50%" height="40px" />
                  <Skeleton variant="rectangular" width="50%" height="40px" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 text-[#8B9DAF]">Belum ada sesi ngaji.</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Riwayat Sesi Ngaji</h2>
            {sessions.map((session) => {
              const badge = getScoreBadge(session.accuracy);
              const hasComment = !!session.teacher_comment;
              const isUnread = hasComment && !session.comment_read_at;
              const errorSummary = summarizeErrors(session.errors);
              const hasErrors = session.errors && session.errors.some((e: any) => e.status !== 'correct');

              return (
                <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-white text-lg">{session.surah_name || 'Surah Tidak Diketahui'}</div>
                      <div className="text-xs text-[#8B9DAF]">
                        {new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${badge.bg} ${badge.text}`}>
                      {session.accuracy}% {badge.label}
                    </div>
                  </div>

                  {/* Comment Section */}
                  {hasComment ? (
                    <div className={`p-3 rounded-xl mb-3 border-l-4 ${isUnread ? 'bg-[#FFF9C4]/10 border-[#F39C12]' : 'bg-white/5 border-[#4fff00]'}`}>
                      <div className="flex items-start gap-2">
                        <MessageCircle size={16} className={isUnread ? 'text-[#F39C12] mt-0.5' : 'text-[#4fff00] mt-0.5'} />
                        <div>
                          <p className="text-sm text-white italic">"{session.teacher_comment}"</p>
                          <p className="text-xs text-[#8B9DAF] mt-1">
                            {isUnread ? 'Menunggu dibaca siswa' : 'Sudah dibaca siswa ✓'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3" />
                  )}

                  {/* 🔥 Tombol Aksi: Kesalahan Tajwid + Komentar (berdampingan) */}
                  <div className="flex gap-3">
                    {/* Tombol Kesalahan Tajwid - hanya muncul jika ada error */}
                    {hasErrors && (
                      <button
                        onClick={() => openTajwidModal(session)}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/30 hover:bg-[#E74C3C]/20"
                      >
                        <BookOpen size={16} />
                        Kesalahan Tajwid
                      </button>
                    )}

                    {/* Tombol Komentar */}
                    <button
                      onClick={() => setCommentSessionId(session.id)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${hasComment
                          ? 'bg-white/5 text-[#8B9DAF] hover:bg-white/10'
                          : 'bg-[#4fff00]/10 text-[#4fff00] border border-[#4fff00]/30 hover:bg-[#4fff00]/20'
                        }`}
                    >
                      {hasComment ? <><CheckCircle size={16} /> Lihat / Ubah Komentar</> : <><MessageCircle size={16} /> Tulis Komentar</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 🔥 MODAL KESALAHAN TAJWID */}
      {tajwidModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A2E] border border-[#E74C3C]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">

            {/* Header Modal */}
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E74C3C]/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#E74C3C]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Kesalahan Tajwid</h3>
                  <p className="text-xs text-[#8B9DAF]">
                    {selectedSession.surah_name} • {new Date(selectedSession.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <button onClick={closeTajwidModal} className="p-2 rounded-full hover:bg-white/10 text-[#8B9DAF] hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Content Modal - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Group errors by ayat */}
              {(() => {
                const errorsByAyat: Record<string, any[]> = {};
                selectedSession.errors.forEach((error: any) => {
                  if (error.status !== 'correct') {
                    const ayatKey = error.ayah || 'Ayat Tidak Diketahui';
                    if (!errorsByAyat[ayatKey]) {
                      errorsByAyat[ayatKey] = [];
                    }
                    errorsByAyat[ayatKey].push(error);
                  }
                });

                return Object.entries(errorsByAyat).map(([ayatKey, errors]) => {
                  // Ambil ayat text dari error pertama (karena semua error di ayat yang sama punya ayah_text yang sama)
                  const ayatText = errors[0]?.ayah_text || '';
                  const highlightedAyat = highlightAyat(ayatText, errors);

                  return (
                    <div key={ayatKey} className="bg-black/30 rounded-xl p-4 border border-white/5">
                      {/* Label Ayat */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded bg-[#E74C3C]/20 text-[#E74C3C] text-xs font-bold">
                          {ayatKey}
                        </span>
                      </div>

                      {/* Full Ayat dengan Highlight */}
                      <div
                        className="text-right font-arabic text-2xl leading-loose mb-4 p-4 bg-[#0D1B2A] rounded-lg border border-white/10"
                        dangerouslySetInnerHTML={{ __html: highlightedAyat }}
                      />

                      {/* Daftar Kesalahan */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#8B9DAF] uppercase tracking-wide">
                          Detail Kesalahan:
                        </p>
                        {errors.map((error, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-[#E74C3C]/5 rounded-lg border-l-2 border-[#E74C3C]">
                            <AlertTriangle size={16} className="text-[#E74C3C] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-white">
                                  {error.rule}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E74C3C]/20 text-[#E74C3C]">
                                  Score: {error.score}%
                                </span>
                              </div>
                              <p className="text-xs text-[#8B9DAF] mb-1">
                                Kata: <span className="font-arabic text-sm text-white bg-white/10 px-2 py-0.5 rounded">{error.matched_text}</span>
                              </p>
                              <p className="text-xs text-[#F39C12]">
                                {error.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Modal */}
            <div className="p-5 border-t border-white/10 bg-[#0D1B2A]/50">
              <button
                onClick={() => {
                  closeTajwidModal();
                  setCommentSessionId(selectedSession.id);
                }}
                className="w-full py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Tulis Komentar Berdasarkan Kesalahan Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Panel Modal */}
      {commentSessionId && (
        <CommentPanel
          sessionId={commentSessionId}
          studentName={studentName}
          surahName={sessions.find(s => s.id === commentSessionId)?.surah_name || 'Sesi Ngaji'}
          classCode={teacher.classCode!}
          teacherId={teacher.id}
          onClose={() => setCommentSessionId(null)}
          onSuccess={handleCommentSuccess}
        />
      )}
    </div>
  );
}