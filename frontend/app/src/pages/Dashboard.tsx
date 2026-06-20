import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import GreetingCard from '@/components/GreetingCard';
import MenuCards from '@/components/MenuCards';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/useUser';
import { useTeacher } from '@/hooks/useTeacher';
import ClassJoinPrompt from '@/components/ClassJoinPrompt'; // 🔥 Import modal join
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '@/components/ConfirmModal';

export default function Dashboard() {
  const { user } = useUser();
  const { switchToTeacher } = useTeacher();
  const [mascotMessage, setMascotMessage] = useState('');
  const navigate = useNavigate();

  // 🔥 State untuk modal join kelas
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [classToLeave, setClassToLeave] = useState<any>(null);
  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);
    const handleConfirmLeave = async () => {
    if (classToLeave) {
      // Panggil backend untuk soft-delete
      await api.leaveClass(classToLeave.code, user?.id || '');
      
      // Hapus dari localStorage
      const myClasses = JSON.parse(localStorage.getItem('ngaji_student_classes') || '[]');
      const updatedClasses = myClasses.filter((c: any) => c.code !== classToLeave.code);
      localStorage.setItem('ngaji_student_classes', JSON.stringify(updatedClasses));
      
      // Tutup modal & refresh
      setIsLeaveModalOpen(false);
      setClassToLeave(null);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-28 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      <Header userName={user?.name || 'Pembaca'} />
      <main className="app-container pt-20 sm:pt-24 lg:pt-28 relative" style={{ zIndex: 1 }}>
        {/* Greeting Card */}
        <GreetingCard
          userName={user?.name || 'Pembaca'}
          streak={user?.streak || 0}
          onMascotMessage={handleMascotMessage}
        />

        {/* 🔥 LOGIKA MULTI-KELAS */}
        {(() => {
          const myClasses = JSON.parse(localStorage.getItem('ngaji_student_classes') || '[]');

          if (myClasses.length === 0) {
            // BELUM PUNYA KELAS
            return (
              <div className="w-full mt-4 lg:mt-6 flex justify-center">
                <button
                  onClick={() => setShowJoinPrompt(true)}
                  className="w-full max-w-md flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#4fff00]/10 border border-[#4fff00]/30 text-[#4fff00] font-bold text-lg hover:bg-[#4fff00]/20 transition-all shadow-lg"
                >
                  <span className="text-2xl">🏫</span>
                  <span>Masuk / Join Kelas</span>
                </button>
              </div>
            );
          }

          // SUDAH PUNYA KELAS (Tampilkan List)
          return (
            <div className="w-full mt-4 lg:mt-6 max-w-md mx-auto space-y-3">
              <h3 className="text-sm font-semibold text-[#8B9DAF] px-2">Kelas Aktif Kamu:</h3>
              {myClasses.map((cls: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-bold text-white text-sm">{cls.name || 'Kelas Ngaji'}</p>
                    <p className="text-xs text-[#4fff00] font-mono">{cls.code}</p>
                  </div>

                  {/* 🔥 INI KUNCINYA: Tombol ini hanya menghapus cls.code yang spesifik */}
                  <button
                    onClick={() => {
                      // Buka modal custom, simpan data kelas yang mau ditinggalkan
                      setClassToLeave(cls);
                      setIsLeaveModalOpen(true);
                    }}
                    className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                  >
                    Keluar
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowJoinPrompt(true)}
                className="w-full py-3 rounded-xl border border-dashed border-[#4fff00]/30 text-[#4fff00] text-sm font-semibold hover:bg-[#4fff00]/5 transition"
              >
                + Tambah Kelas Guru Lain
              </button>
            </div>
          );
        })()}

        {/* Menu Cards Section */}
        <div className="w-full mt-4 lg:mt-6">
          <MenuCards onMascotMessage={handleMascotMessage} />
        </div>

        {/* Tombol Mode Guru (Opsional, taruh di bawah jika perlu) */}
        <div className="w-full mt-6 flex justify-center">
          <button
            onClick={() => navigate('/guru/gate')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[#8B9DAF] font-semibold hover:bg-white/10 transition-all text-sm"
          >
            👩‍🏫 Masuk ke Mode Guru
          </button>
        </div>
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />

            {/* Modal Join Kelas (Existing) */}
      {showJoinPrompt && (
        <ClassJoinPrompt 
          userId={user?.id || 'unknown'}
          onClose={() => setShowJoinPrompt(false)} 
          onSuccess={() => {
            setShowJoinPrompt(false);
            setMascotMessage('🎉 Yeay! Kamu berhasil bergabung ke kelas!');
          }} 
        />
      )}

      {/* 🔥 Custom Confirmation Modal (BARU) */}
      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="Yakin Mau Keluar Kelas?"
        message={`Kamu akan keluar dari "${classToLeave?.name || 'Kelas ini'}". Data ngajimu tetap aman, tapi guru tidak bisa memantau progressmu lagi.`}
        variant="danger"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onConfirm={handleConfirmLeave}
        onCancel={() => {
          setIsLeaveModalOpen(false);
          setClassToLeave(null);
        }}
      />
    </div>
  );
}