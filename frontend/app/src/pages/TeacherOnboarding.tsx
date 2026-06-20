import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, CheckCircle, Users, BookOpen } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

export default function TeacherOnboarding() {
  const navigate = useNavigate();
  const { teacher, setClassInfo, setOnboardingDone, addNewClass } = useTeacher();
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateClass = async () => {
    if (!className.trim() || className.length < 3) {
      return toastError('Nama kelas minimal 3 huruf ya, Ustadz/Ustadzah!');
    }
    
    setLoading(true);
    try {
      const res = await api.createClass(teacher!.id, className);
      
      if (res.class_code) {
        setClassCode(res.class_code);
        setClassInfo(res.class_code, res.class_name);
        
        // 🔥 FIX: Simpan ke array multi-class (pakai Date.now() sebagai ID lokal)
        const newClass = {
          id: Date.now().toString(), // Generate ID lokal
          classCode: res.class_code,
          className: res.class_name,
          teacherId: teacher!.id
        };
        
        // Panggil fungsi dari hook useTeacher (jika ada), atau langsung ke localStorage
        if (addNewClass) {
          addNewClass(newClass);
        } else {
          const existingClasses = JSON.parse(localStorage.getItem('ngaji_teacher_classes') || '[]');
          existingClasses.push(newClass);
          localStorage.setItem('ngaji_teacher_classes', JSON.stringify(existingClasses));
        }
        
        localStorage.setItem('ngaji_teacher_active_class', res.class_code);
        
        toastSuccess('🎉 Kelas berhasil dibuat!');
        setStep(3);
      } else {
        toastError(res.detail || 'Gagal membuat kelas. Coba lagi ya.');
      }
    } catch (e) {
      toastError('Gagal terhubung ke server. Cek koneksi internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setOnboardingDone(true);
    navigate('/guru/dashboard');
  };

  const shareToWA = () => {
    const text = `Assalamu'alaikum! Ayo bergabung di kelas ngaji online AI NGAJI.\n\nKode Kelas: *${classCode}*\nNama Kelas: ${teacher?.className}\n\nCara join: Buka app AI NGAJI > Pilih "Saya Siswa" > Masukkan kode ini.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D1B2A]">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-[#4fff00]/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#4fff00]' : 'bg-white/10'}`} 
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-[#4fff00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[#4fff00]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Selamat Datang, Ustadz/Ustadzah! 👋</h2>
            <p className="text-[#8B9DAF]">Kami akan bantu kamu memantau perkembangan siswamu dengan mudah dan modern.</p>
            <button 
              onClick={() => setStep(2)} 
              className="w-full py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl mt-4 hover:bg-[#3dd800] transition"
            >
              Lanjut
            </button>
          </div>
        )}

        {/* Step 2: Input Nama Kelas */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white">Apa nama kelas yang kamu ajar?</h2>
            <p className="text-sm text-[#8B9DAF]">Contoh: Kelas 3A, Kelompok Pagi, Ngaji Rumah</p>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Ketik nama kelas di sini..."
              className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#4fff00] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
            />
            <button 
              onClick={handleCreateClass} 
              disabled={loading} 
              className="w-full py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition disabled:opacity-50"
            >
              {loading ? 'Membuat Kelas...' : 'Buat Kelas'}
            </button>
          </div>
        )}

        {/* Step 3: Kode Kelas */}
        {step === 3 && (
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white">Ini Kode Kelasmu! 🎉</h2>
            <p className="text-sm text-[#8B9DAF]">Bagikan kode ini ke siswa agar mereka bisa bergabung.</p>
            <div className="p-6 bg-[#4fff00]/10 border-2 border-dashed border-[#4fff00] rounded-2xl">
              <span className="text-4xl font-mono font-bold text-[#4fff00] tracking-widest">{classCode}</span>
            </div>
            <button 
              onClick={shareToWA} 
              className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#1da851] transition"
            >
              <Share2 size={20} /> Bagikan via WhatsApp
            </button>
            <button 
              onClick={() => setStep(4)} 
              className="w-full py-3 text-[#8B9DAF] hover:text-white transition"
            >
              Sudah Dibagikan, Lanjut
            </button>
          </div>
        )}

        {/* Step 4: Instruksi Siswa */}
        {step === 4 && (
          <div className="text-center space-y-4 animate-fade-in">
            <BookOpen className="w-16 h-16 text-[#4fff00] mx-auto" />
            <h2 className="text-xl font-bold text-white">Cara Siswa Bergabung</h2>
            <p className="text-sm text-[#8B9DAF] text-left bg-black/20 p-4 rounded-xl">
              1. Minta siswa buka aplikasi AI NGAJI.<br />
              2. Pilih menu <strong>"Saya Siswa"</strong>.<br />
              3. Masukkan kode <strong>{classCode}</strong> saat diminta.
            </p>
            <button 
              onClick={() => setStep(5)} 
              className="w-full py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition"
            >
              Paham, Lanjut
            </button>
          </div>
        )}

        {/* Step 5: Selesai */}
        {step === 5 && (
          <div className="text-center space-y-4 animate-fade-in">
            <CheckCircle className="w-20 h-20 text-[#4fff00] mx-auto" />
            <h2 className="text-2xl font-bold text-white">Dashboard Siap! 🚀</h2>
            <p className="text-[#8B9DAF]">Sekarang kamu bisa memantau progress siswa dan memberi mereka semangat lewat komentar.</p>
            <button 
              onClick={handleFinish} 
              className="w-full py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition"
            >
              Lihat Dashboard
            </button>
          </div>
        )}

        {/* Skip Button */}
        {step < 5 && step > 1 && (
          <button 
            onClick={handleFinish} 
            className="absolute top-4 right-4 text-xs text-[#4A5D70] hover:text-white transition"
          >
            Lewati
          </button>
        )}
      </div>
    </div>
  );
}