import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

interface Props {
  sessionId: number;
  studentName: string;
  surahName: string;
  classCode: string;
  teacherId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATES = [
  "👍 Bacaanmu sudah bagus, terus semangat!",
  "📚 Pelajari lagi hukum tajwid ini ya",
  "🌟 Alhamdulillah, nilai kamu meningkat!",
  "✏️ Perhatikan panjang bacaan Mad-nya ya",
  "🤲 Semangat terus belajar ngajinya ya!"
];

export default function CommentPanel({ sessionId, studentName, surahName, classCode, teacherId, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await api.sendComment(sessionId.toString(), classCode, comment, teacherId);
      toastSuccess('💬 Komentar berhasil dikirim!');
      
      // 🔥 FIX LOGICAL: Beritahu parent component untuk refresh data & tutup modal
      onSuccess(); 
      onClose();   
    } catch (err) {
      toastError('Gagal mengirim komentar. Coba lagi ya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#1A1A2E] border-t sm:border border-[#4fff00]/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Komentar untuk {studentName}</h3>
            <p className="text-sm text-[#8B9DAF]">Sesi: {surahName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[#8B9DAF] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Templates */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => setComment(tpl)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#4fff00]/10 border border-[#4fff00]/30 text-[#4fff00] text-xs hover:bg-[#4fff00]/20 transition"
            >
              {tpl}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 280))}
          placeholder="Tulis pesan semangat untuk siswa..."
          className="w-full h-32 p-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#4fff00] focus:outline-none resize-none mb-2"
        />
        <div className="text-right text-xs text-[#8B9DAF] mb-4">{comment.length}/280 karakter</div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-[#8B9DAF] hover:bg-white/5 transition font-semibold">
            Batal
          </button>
          <button 
            onClick={handleSend} 
            disabled={loading || !comment.trim()}
            className="flex-1 py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Mengirim...' : <><Send size={18} /> Kirim ke Siswa</>}
          </button>
        </div>
      </div>
    </div>
  );
}