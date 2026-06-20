import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  // Warna Hijau Neon untuk default, Merah untuk danger (keluar/hapus)
  const primaryColor = isDanger ? '#E74C3C' : '#4fff00';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-scale-in">
        
        {/* Tombol Close (X) */}
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 text-[#8B9DAF] hover:text-white transition p-1 rounded-full hover:bg-white/5"
        >
          <X size={20} />
        </button>

        {/* Ikon Dinamis */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-[#E74C3C]/20' : 'bg-[#4fff00]/20'}`}>
          {isDanger ? (
            <AlertTriangle className="w-7 h-7 text-[#E74C3C]" />
          ) : (
            <HelpCircle className="w-7 h-7 text-[#4fff00]" />
          )}
        </div>

        {/* Konten Teks */}
        <h3 className="text-lg font-bold text-white text-center mb-2">{title}</h3>
        <p className="text-sm text-[#8B9DAF] text-center mb-6 leading-relaxed px-2">
          {message}
        </p>

        {/* Tombol Aksi */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-[#8B9DAF] hover:bg-white/5 transition font-semibold border border-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold transition text-[#0D1B2A] hover:opacity-90 shadow-lg"
            style={{ background: primaryColor, boxShadow: `0 4px 15px ${primaryColor}40` }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}