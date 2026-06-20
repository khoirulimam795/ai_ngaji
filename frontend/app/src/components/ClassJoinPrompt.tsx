import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

interface Props {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClassJoinPrompt({ userId, onClose, onSuccess }: Props) {
  const [name, setName] = useState(localStorage.getItem('ngaji_user_name') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!name.trim()) return toastError('Tulis namamu dulu ya!');
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.joinClass(code.toUpperCase(), userId, name.trim());
      if (res.success) {
        // 🔥 PERUBAHAN: Simpan sebagai Array agar bisa banyak guru
        const existingClasses = JSON.parse(localStorage.getItem('ngaji_student_classes') || '[]');

        // Cek apakah kode sudah ada di array
        const alreadyJoined = existingClasses.some((c: any) => c.code === code.toUpperCase());

        if (!alreadyJoined) {
          existingClasses.push({ code: code.toUpperCase(), name: res.class_name });
          localStorage.setItem('ngaji_student_classes', JSON.stringify(existingClasses));
        }

        localStorage.setItem('ngaji_user_name', name.trim());
        toastSuccess('🎉 Berhasil bergabung ke kelas!');

        // 🔥 FIX: Beritahu parent component bahwa join berhasil
        onSuccess();
      } else {
        toastError(res.detail || res.message || 'Gagal bergabung.');
      }
    } catch (e) {
      toastError('Kode tidak ditemukan. Tanya gurumu ya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A2E] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8B9DAF] hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">Bergabung ke Kelas 🏫</h3>
        <p className="text-sm text-[#8B9DAF] mb-4">
          Masukkan nama dan kode dari gurumu agar beliau bisa melihat progressmu!
        </p>

        {/* INPUT NAMA BARU */}
        <label className="text-xs text-[#8B9DAF] mb-1 block">Nama Panggilan</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Budi, Aisyah, dll"
          className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white mb-3 focus:border-[#D4AF37] focus:outline-none"
        />

        <label className="text-xs text-[#8B9DAF] mb-1 block">Kode Kelas</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
          placeholder="Contoh: 3A-X7K2"
          className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white text-center text-xl font-mono tracking-widest focus:border-[#D4AF37] focus:outline-none mb-2"
          maxLength={7}
        />

        {error && <p className="text-[#E74C3C] text-xs mb-3 text-center">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[#8B9DAF] hover:bg-white/5 transition">
            Batal
          </button>
          <button
            onClick={handleJoin}
            disabled={loading || code.length < 5 || !name.trim()}
            className="flex-1 py-3 bg-[#D4AF37] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#b8962e] transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Gabung Kelas'}
          </button>
        </div>
      </div>
    </div>
  );
}