import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Send, Edit3, CheckCircle, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';
import { api } from '@/lib/api';
import { toastSuccess, toastError, toastPromise } from '@/lib/toast';

export default function MaterialUpload() {
  const navigate = useNavigate();
  const { teacher } = useTeacher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  
  // Data Preview & Form
  const [uploadId, setUploadId] = useState('');
  const [sourceFilename, setSourceFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exampleArab, setExampleArab] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [newTip, setNewTip] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.includes('pdf')) {
      toastError('File harus berformat PDF ya!');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toastError('Ukuran file maksimal 10MB.');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const res = await api.uploadMaterial(teacher!.classCode!, selectedFile, teacher!.id);
      if (res.success) {
        setUploadId(res.upload_id);
        setSourceFilename(res.source_filename);
        
        // Isi form dengan hasil preview
        setTitle(res.card_preview.title || '');
        setDescription(res.card_preview.description || '');
        setExampleArab(res.card_preview.example_arab || '');
        setTips(res.card_preview.tips || []);
        
        setStep('preview');
      } else {
        toastError(res.detail || 'Gagal memproses PDF.');
        setStep('upload');
      }
    } catch (err) {
      toastError('Terjadi kesalahan saat upload.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const addTip = () => {
    if (newTip.trim()) {
      setTips([...tips, newTip.trim()]);
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!title.trim()) return toastError('Judul materi tidak boleh kosong.');
    setLoading(true);

    try {
      const res = await api.publishMaterial(teacher!.classCode!, {
        upload_id: uploadId,
        title,
        description,
        example_arab: exampleArab,
        tips,
        source_filename: sourceFilename
      }, teacher!.id);

      if (res.success) {
        setStep('success');
      } else {
        toastError(res.detail || 'Gagal publish materi.');
      }
    } catch (err) {
      toastError('Terjadi kesalahan saat upload.');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-bold text-white">Upload Materi PDF</h1>
          <p className="text-xs text-[#8B9DAF]">{teacher.className}</p>
        </div>
      </header>

      <main className="p-5 max-w-2xl mx-auto">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="mt-8 text-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#4fff00]/30 rounded-3xl p-12 cursor-pointer hover:bg-[#4fff00]/5 transition-all group"
            >
              {loading ? (
                <Loader2 className="w-16 h-16 text-[#4fff00] mx-auto animate-spin mb-4" />
              ) : (
                <Upload className="w-16 h-16 text-[#4fff00] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              )}
              <h3 className="text-xl font-bold text-white mb-2">
                {loading ? 'Sedang Membaca PDF...' : 'Pilih File PDF'}
              </h3>
              <p className="text-sm text-[#8B9DAF]">
                {loading ? 'Sistem sedang mengekstrak teks...' : 'Maksimal 10MB. Format PDF.'}
              </p>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileChange} 
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & EDIT */}
        {step === 'preview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#4fff00]/10 border border-[#4fff00]/30 rounded-xl p-4 flex items-start gap-3">
              <Edit3 className="w-5 h-5 text-[#4fff00] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-[#4fff00]">Cek & Edit Materi</h3>
                <p className="text-xs text-[#8B9DAF]">Hasil ekstraksi PDF. Silakan edit jika ada yang kurang tepat sebelum dikirim ke siswa.</p>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8B9DAF] mb-1 block">Judul Materi</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-[#4fff00] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8B9DAF] mb-1 block">Penjelasan</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-[#4fff00] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8B9DAF] mb-1 block">Contoh Bacaan Arab (Opsional)</label>
                <input 
                  type="text" 
                  value={exampleArab} 
                  onChange={(e) => setExampleArab(e.target.value)}
                  className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white font-arabic text-right text-xl focus:border-[#4fff00] focus:outline-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-xs text-[#8B9DAF] mb-1 block">Tips / Poin Penting</label>
                <div className="space-y-2 mb-2">
                  {tips.map((tip, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                      <span className="text-[#4fff00] text-sm">•</span>
                      <span className="text-sm text-white flex-1">{tip}</span>
                      <button onClick={() => removeTip(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTip} 
                    onChange={(e) => setNewTip(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTip()}
                    placeholder="Tambah tips baru..."
                    className="flex-1 p-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-[#4fff00] focus:outline-none"
                  />
                  <button onClick={addTip} className="p-2 bg-[#4fff00]/20 text-[#4fff00] rounded-lg hover:bg-[#4fff00]/30">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setStep('upload')} 
                className="flex-1 py-3 rounded-xl text-[#8B9DAF] hover:bg-white/5 transition font-semibold"
              >
                Batal
              </button>
              <button 
                onClick={handlePublish} 
                disabled={loading}
                className="flex-1 py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Kirim ke Siswa</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="mt-12 text-center animate-fade-in">
            <CheckCircle className="w-20 h-20 text-[#4fff00] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Materi Berhasil Dikirim! 🎉</h2>
            <p className="text-[#8B9DAF] mb-8">Siswa di kelas {teacher.className} sekarang bisa melihat materi ini di halaman Belajar.</p>
            <button 
              onClick={() => navigate('/guru/dashboard')} 
              className="px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}