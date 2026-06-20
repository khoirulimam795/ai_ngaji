import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';

export default function TeacherClassSelector() {
  const navigate = useNavigate();
  const { classes, setActiveClass, switchToStudent } = useTeacher();
  const [activeCode, setActiveCode] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('ngaji_teacher_active_class');
    if (saved) setActiveCode(saved);
  }, []);

  const handleSelect = (classCode: string) => {
    setActiveCode(classCode);
    setActiveClass(classCode);
    navigate('/guru/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Pilih Kelas</h1>
          <p className="text-[#8B9DAF]">Kelas mana yang ingin kamu kelola hari ini?</p>
        </div>

        <div className="space-y-3">
          {classes.map((cls) => (
            <button
              key={cls.classCode}
              onClick={() => handleSelect(cls.classCode)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition ${
                activeCode === cls.classCode 
                  ? 'bg-[#4fff00]/10 border-[#4fff00]' 
                  : 'bg-white/5 border-white/10 hover:border-[#4fff00]/50'
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-white">{cls.className}</div>
                <div className="text-xs text-[#4fff00] font-mono">{cls.classCode}</div>
              </div>
              {activeCode === cls.classCode && <Check className="text-[#4fff00]" />}
            </button>
          ))}

          <button
            onClick={() => navigate('/guru/onboarding')}
            className="w-full p-4 rounded-2xl border border-dashed border-[#4fff00]/30 text-[#4fff00] font-bold flex items-center justify-center gap-2 hover:bg-[#4fff00]/5 transition"
          >
            <Plus size={20} /> Buat Kelas Baru
          </button>
        </div>

        <button
          onClick={switchToStudent}
          className="w-full mt-6 py-3 text-[#8B9DAF] hover:text-white transition"
        >
          ← Kembali ke Mode Siswa
        </button>
      </div>
    </div>
  );
}