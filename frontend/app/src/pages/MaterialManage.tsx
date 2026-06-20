import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Plus, X, Save, FileText } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function MaterialManage() {
  const navigate = useNavigate();
  const { teacher } = useTeacher();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', example_arab: '', tips: [] as string[] });
  
  // State untuk Hapus
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (teacher?.classCode && teacher?.id) {
      api.getTeacherMaterials(teacher.classCode, teacher.id).then(res => {
        setMaterials(res.materials || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [teacher]);

  const startEdit = (mat: any) => {
    setEditingId(mat.id);
    setEditForm({
      title: mat.title,
      description: mat.description || '',
      example_arab: mat.example_arab || '',
      tips: mat.tips || []
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.title.trim()) {
      return toastError('Judul materi tidak boleh kosong.');
    }
    
    try {
      const res = await api.updateMaterial(teacher!.classCode!, editingId, editForm, teacher!.id);
      if (res.success) {
        toastSuccess('✅ Materi berhasil diupdate!');
        // Refresh list
        const res2 = await api.getTeacherMaterials(teacher!.classCode!, teacher!.id);
        setMaterials(res2.materials || []);
        cancelEdit();
      } else {
        toastError(res.detail || 'Gagal mengupdate materi.');
      }
    } catch (err) {
      toastError('Terjadi kesalahan saat mengupdate.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.deleteMaterial(teacher!.classCode!, deleteId, teacher!.id);
      if (res.success) {
        toastSuccess('🗑️ Materi berhasil dihapus!');
        setMaterials(materials.filter(m => m.id !== deleteId));
      } else {
        toastError(res.detail || 'Gagal menghapus materi.');
      }
    } catch (err) {
      toastError('Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
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
          <h1 className="text-lg font-bold text-white">Kelola Materi</h1>
          <p className="text-xs text-[#8B9DAF]">{teacher.className}</p>
        </div>
      </header>

      <main className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-[#4fff00]" />
            Daftar Materi ({materials.length})
          </h2>
          <button
            onClick={() => navigate('/guru/material-upload')}
            className="px-4 py-2 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl hover:bg-[#3dd800] transition flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Tambah Baru
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#8B9DAF]">Memuat materi...</div>
        ) : materials.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <FileText className="w-12 h-12 text-[#8B9DAF] mx-auto mb-3" />
            <p className="text-[#8B9DAF] mb-4">Belum ada materi yang diupload.</p>
            <button onClick={() => navigate('/guru/material-upload')} className="px-6 py-2 bg-[#4fff00]/10 text-[#4fff00] rounded-xl hover:bg-[#4fff00]/20 transition">
              Upload Materi Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((mat) => (
              <div key={mat.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all">
                {editingId === mat.id ? (
                  // 🔥 MODE EDIT
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[#8B9DAF] mb-1 block">Judul Materi</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-[#4fff00] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8B9DAF] mb-1 block">Deskripsi</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={3}
                        className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white focus:border-[#4fff00] focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8B9DAF] mb-1 block">Contoh Arab (Opsional)</label>
                      <input
                        type="text"
                        value={editForm.example_arab}
                        onChange={(e) => setEditForm({...editForm, example_arab: e.target.value})}
                        className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white font-arabic text-right text-xl focus:border-[#4fff00] focus:outline-none"
                        dir="rtl"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={saveEdit} className="flex-1 py-3 bg-[#4fff00] text-[#0D1B2A] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#3dd800] transition">
                        <Save size={18} /> Simpan Perubahan
                      </button>
                      <button onClick={cancelEdit} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  // 🔥 MODE VIEW
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white text-lg flex-1 pr-4">{mat.title}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(mat)} className="p-2 bg-[#4fff00]/10 text-[#4fff00] rounded-lg hover:bg-[#4fff00]/20 transition" title="Edit">
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => { setDeleteId(mat.id); setIsDeleteModalOpen(true); }}
                          className="p-2 bg-[#E74C3C]/10 text-[#E74C3C] rounded-lg hover:bg-[#E74C3C]/20 transition"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {mat.description && <p className="text-sm text-[#8B9DAF] mb-3 leading-relaxed">{mat.description}</p>}
                    
                    {mat.example_arab && (
                      <div className="bg-white/5 rounded-lg p-3 mb-3 text-right border border-white/5">
                        <span className="font-arabic text-xl text-[#F5E6C4]">{mat.example_arab}</span>
                      </div>
                    )}
                    
                    {mat.tips?.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {mat.tips.map((tip: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-[#4ECDC4]">
                            <span className="mt-0.5">•</span>
                            <span className="text-[#8B9DAF]">{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-[10px] text-[#4A5D70] mt-2">
                      Diupload: {new Date(mat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Materi Ini?"
        message="Materi yang dihapus akan hilang dari halaman Belajar siswa. Tindakan ini tidak bisa dibatalkan."
        variant="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setIsDeleteModalOpen(false); setDeleteId(null); }}
      />
    </div>
  );
}