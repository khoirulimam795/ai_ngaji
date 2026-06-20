import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Sparkles, Lock } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';

export default function TeacherGate() {
  const navigate = useNavigate();
  const { switchToStudent, switchToTeacher, teacher } = useTeacher();

  //  State untuk Modal PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleStudentMode = () => {
    switchToStudent();
    navigate('/');
  };

  // Saat tombol "Saya Guru" diklik, jangan langsung masuk, tapi buka modal PIN
  const handleTeacherModeClick = () => {
    setShowPinModal(true);
  };

  const verifyPin = () => {
    const SECRET_TEACHER_CODE = "NGAJI2024";

    if (pinInput.toUpperCase() === SECRET_TEACHER_CODE) {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');

      // 🔥 FIX: Set role LANGSUNG di localStorage (TANPA reload)
      localStorage.setItem('ngaji_user_role', 'teacher');

      // Cek apakah sudah punya kelas
      const hasClass = localStorage.getItem('ngaji_teacher_class_code');

      if (hasClass) {
        // Sudah punya kelas -> Langsung ke Dashboard
        navigate('/guru/class-selector');
      } else {
        // Belum punya kelas -> Ke Onboarding untuk buat kelas baru
        navigate('/guru/onboarding');
      }
    } else {
      setPinError('Kode salah! Mode Guru hanya untuk Ustadz/Ustadzah.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0D1B2A]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A] via-[#0a1520] to-[#050a10]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4fff00]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full">
        <button
          onClick={() => navigate('/')}
          className="absolute -top-16 left-0 flex items-center gap-2 text-[#8B9DAF] hover:text-[#4fff00] transition-colors duration-300 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Kembali ke Beranda</span>
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4fff00]/10 border border-[#4fff00]/30 mb-4">
              <Sparkles className="w-8 h-8 text-[#4fff00]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Pilih Mode Penggunaan</h1>
            <p className="text-[#8B9DAF] text-base md:text-lg max-w-xl mx-auto">AI NGAJI bisa dipakai untuk belajar mandiri atau memantau kelas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Siswa */}
            <button
              onClick={handleStudentMode}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Saya Siswa 🧒</h2>
              <p className="text-sm text-[#8B9DAF] mb-6 leading-relaxed">Untuk belajar tajwid, rekam bacaan, dan lihat progress harianmu.</p>
              <span className="mt-auto w-full py-3 px-6 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] font-semibold border border-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-[#0D1B2A] transition-all duration-300">
                Masuk sebagai Siswa
              </span>
            </button>

            {/* Kartu Guru (Dengan Trigger PIN) */}
            <button
              onClick={handleTeacherModeClick}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-[#4fff00]/5 border border-[#4fff00]/30 hover:border-[#4fff00] transition-all duration-300 hover:shadow-[0_0_25px_rgba(79,255,0,0.3)] hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#4fff00]/20 blur-[30px] rounded-full pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-[#4fff00]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#4fff00]/20">
                <Users className="w-8 h-8 text-[#4fff00]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Saya Guru 👩‍🏫</h2>
              <p className="text-sm text-[#8B9DAF] mb-6 leading-relaxed">Untuk membuat kelas, upload materi, dan memberi komentar ke siswa.</p>
              <span className="mt-auto w-full py-3 px-6 rounded-xl bg-[#4fff00]/10 text-[#4fff00] font-semibold border border-[#4fff00]/30 group-hover:bg-[#4fff00] group-hover:text-[#0D1B2A] transition-all duration-300 shadow-[0_0_10px_rgba(79,255,0,0.1)] group-hover:shadow-[0_0_20px_rgba(79,255,0,0.4)]">
                Masuk sebagai Guru
              </span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#4A5D70]">💡 Belum yakin? Tanya admin atau guru ngajimu ya!</p>
          </div>
        </div>
      </div>

      {/* 🔒 MODAL PIN RAHASIA */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A2E] border border-[#4fff00]/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#4fff00]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#4fff00]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🔒 Mode Khusus Guru</h3>
            <p className="text-sm text-[#8B9DAF] mb-4">Masukkan kode aktivasi guru untuk melanjutkan. Kode ini hanya diketahui oleh pengajar.</p>

            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
              placeholder="Kode Aktivasi"
              className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white text-center text-lg tracking-widest focus:border-[#4fff00] focus:outline-none mb-2 uppercase"
              autoFocus
            />

            {pinError && <p className="text-[#E74C3C] text-xs mb-3 font-semibold">{pinError}</p>}

            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }} className="flex-1 py-3 rounded-xl text-[#8B9DAF] hover:bg-white/5 transition">
                Batal
              </button>
              <button onClick={verifyPin} className="flex-1 py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition">
                Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}