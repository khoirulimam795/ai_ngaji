import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, MessageCircle, User, Upload, Download, Edit3 } from 'lucide-react';
import { useTeacher } from '@/hooks/useTeacher';
import { api } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// 🔥 Tambahkan Type Definitions
interface Student {
  user_id: string;
  display_name?: string;
  avg_score?: number | null;
  total_sessions?: number;
  last_surah?: string;
  last_session_at?: string;
  unread_comments?: number;
  joined_at?: string;
}

interface StudentDetail extends Student {
  sessions?: Array<{
    created_at: string;
    surah_name?: string;
    accuracy: number;
    teacher_comment?: string;
  }>;
}

interface Teacher {
  id: string;
  classCode?: string;
  className?: string;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { teacher, switchToStudent } = useTeacher();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    if (teacher?.classCode) {
      api.getClassStudents(teacher.classCode, teacher.id).then(res => {
        setStudents(res.students || []);
        setLoading(false);
      });
    }
  }, [teacher]);

  const copyCode = (): void => {
    if (teacher?.classCode) {
      navigator.clipboard.writeText(teacher.classCode);
      toastSuccess('📋 Kode kelas disalin!');
    }
  };

  // 🔥 FUNGSI EXPORT PDF
  const handleExportPDF = async (): Promise<void> => {
    if (students.length === 0) {
      toastError('Belum ada data siswa untuk diekspor.');
      return;
    }

    setExporting(true);
    toastSuccess('📄 Sedang membuat laporan PDF...');

    try {
      // 1. Ambil detail lengkap semua siswa (riwayat + komentar)
      const studentsDetail: StudentDetail[] = await Promise.all(
        students.map((student: Student) => 
          api.getStudentFullDetail(
            teacher!.classCode!, 
            student.user_id, 
            teacher!.id
          )
        )
      );

      // 2. Buat PDF
      const doc = new jsPDF();
      
      // Header Laporan
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Laporan Progress Kelas', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Kelas: ${teacher!.className}`, 14, 30);
      doc.text(`Kode Kelas: ${teacher!.classCode}`, 14, 37);
      doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })}`, 14, 44);

      // 3. Siapkan Data untuk Tabel Ringkasan
      const tableData: Array<Array<string | number>> = students.map((student: Student, index: number) => {
        let status = 'Belum Ngaji';
        const avgScore = student.avg_score || 0;
        if (avgScore >= 80) status = 'Bagus';
        else if (avgScore >= 60) status = 'Cukup';
        else if (avgScore > 0) status = 'Perlu Perhatian';

        return [
          index + 1,
          student.display_name || `Siswa ${student.user_id.slice(-4)}`,
          avgScore ? `${avgScore}%` : '-',
          student.total_sessions || 0,
          student.last_surah || '-',
          status
        ];
      });

      // 4. Generate Tabel Ringkasan
      autoTable(doc, {
        startY: 55,
        head: [['No', 'Nama Siswa', 'Rata-rata', 'Total Sesi', 'Surat Terakhir', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 255, 0],
          textColor: [13, 27, 42], 
          fontStyle: 'bold' 
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245] 
        },
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          5: { cellWidth: 35 }
        }
      });

      // 5. Tambahkan Detail Riwayat per Siswa (di halaman baru)
      let currentY = doc.internal.pageSize.height - 20;
      
      for (const detail of studentsDetail) {
        // Cek apakah perlu halaman baru
        if (currentY > doc.internal.pageSize.height - 80) {
          doc.addPage();
          currentY = 20;
        }

        // Header Siswa
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(`📚 ${detail.display_name || detail.user_id}`, 14, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Total Sesi: ${detail.total_sessions || 0} | Bergabung: ${detail.joined_at ? new Date(detail.joined_at).toLocaleDateString('id-ID') : '-'}`, 
          14, 
          currentY
        );
        currentY += 10;

        // Tabel Riwayat Sesi
        const sessions = detail.sessions || [];
        if (sessions.length > 0) {
          const sessionData: Array<Array<string | number>> = sessions.slice(0, 10).map((s: any) => [
            new Date(s.created_at).toLocaleDateString('id-ID'),
            s.surah_name || '-',
            `${s.accuracy}%`,
            s.teacher_comment ? '✓' : '-'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Tanggal', 'Surah', 'Akurasi', 'Komentar']],
            body: sessionData,
            theme: 'striped',
            headStyles: { 
              fillColor: [212, 175, 55],
              textColor: [13, 27, 42],
              fontSize: 9
            },
            styles: { 
              fontSize: 8,
              cellPadding: 2
            },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 60 },
              2: { cellWidth: 25 },
              3: { cellWidth: 25 }
            }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text('Belum ada sesi ngaji.', 14, currentY);
          currentY += 10;
        }
      }

      // 6. Footer di semua halaman
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Dibuat oleh AI NGAJI - Halaman ${i} dari ${pageCount}`, 
          14, doc.internal.pageSize.height - 10);
      }

      // 7. Download File
      const fileName = `Laporan_${teacher!.className?.replace(/\s+/g, '_') || 'kelas'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toastSuccess('✅ Laporan PDF berhasil diunduh!');
      
    } catch (err) {
      console.error('Error export PDF:', err);
      toastError('Gagal membuat laporan PDF.');
    } finally {
      setExporting(false);
    }
  };

  // 🔥 PERBAIKAN: Tambahkan tipe untuk parameter score
  const getScoreBadge = (score: number | null | undefined): { bg: string; text: string; label: string } => {
    if (score === null || score === undefined || score === 0) {
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Belum Ngaji' };
    }
    if (score >= 80) {
      return { bg: 'bg-[#2ECC71]/20', text: 'text-[#2ECC71]', label: 'Bagus!' };
    }
    if (score >= 60) {
      return { bg: 'bg-[#F39C12]/20', text: 'text-[#F39C12]', label: 'Cukup' };
    }
    return { bg: 'bg-[#E74C3C]/20', text: 'text-[#E74C3C]', label: 'Perlu Perhatian' };
  };

  if (!teacher) {
    return <div className="p-8 text-white">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D1B2A]/90 backdrop-blur-md border-b border-white/10 px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-white/5">
            <ArrowLeft size={20} className="text-[#E8DCC4]" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{teacher.className || 'Dashboard Guru'}</h1>
            <div className="flex items-center gap-2 cursor-pointer" onClick={copyCode}>
              <span className="text-xs font-mono text-[#4fff00] bg-[#4fff00]/10 px-2 py-0.5 rounded">{teacher.classCode}</span>
              <Copy size={12} className="text-[#8B9DAF]" />
            </div>
          </div>
        </div>
        <button 
          onClick={switchToStudent} 
          className="text-xs text-[#8B9DAF] hover:text-white border border-white/10 px-3 py-1.5 rounded-full"
        >
          Mode Siswa
        </button>
      </header>

      <main className="p-5 max-w-3xl mx-auto">
        {/* Stats Ringkas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-[#4fff00]">{students.length}</div>
            <div className="text-xs text-[#8B9DAF] mt-1">Total Siswa</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-[#D4AF37]">
              {students.length > 0 
                ? Math.round(
                    students.reduce((acc: number, s: Student) => acc + (s.avg_score || 0), 0) / students.length
                  ) 
                : 0}%
            </div>
            <div className="text-xs text-[#8B9DAF] mt-1">Rata-rata Kelas</div>
          </div>
        </div>

        {/* 🔥 TOMBOL AKSI GURU (GRID 2 KOLOM) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate('/guru/material-upload')}
            className="w-full py-4 rounded-2xl bg-[#4fff00]/10 border border-[#4fff00]/30 text-[#4fff00] font-bold flex items-center justify-center gap-3 hover:bg-[#4fff00]/20 transition"
          >
            <Upload size={20} />
            Upload Materi
          </button>

        <button
          onClick={() => navigate('/guru/material-manage')}
          className="w-full py-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-bold flex items-center justify-center gap-3 hover:bg-[#D4AF37]/20 transition"
        >
          <Edit3 size={20} />
        Kelola Materi
      </button>
          
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="w-full py-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-bold flex items-center justify-center gap-3 hover:bg-[#D4AF37]/20 transition disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                Membuat PDF...
              </>
            ) : (
              <>
                <Download size={20} />
                Download Laporan
              </>
            )}
          </button>
        </div>

        {/* Daftar Siswa */}
        <h2 className="text-lg font-bold text-white mb-4">Daftar Siswa</h2>
        
        {loading ? (
          <div className="text-center py-10 text-[#8B9DAF]">Memuat data siswa...</div>
        ) : students.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <User className="w-12 h-12 text-[#8B9DAF] mx-auto mb-3" />
            <p className="text-[#8B9DAF]">Belum ada siswa yang bergabung. <br />Bagikan kode kelasmu ya!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student: Student) => {
              const badge = getScoreBadge(student.avg_score);
              return (
                <div
                  key={student.user_id}
                  onClick={() => navigate(`/guru/student/${student.user_id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-[#4fff00]/50 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#4fff00]/10 flex items-center justify-center text-[#4fff00] font-bold text-lg">
                    {student.display_name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {student.display_name || `Siswa #${student.user_id.slice(-4)}`}
                    </div>
                    <div className="text-xs text-[#8B9DAF] truncate">
                      Terakhir: {student.last_surah || 'Belum ada'} • {student.last_session_at ? new Date(student.last_session_at).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      {student.avg_score ? `${student.avg_score}%` : '-'} {badge.label}
                    </div>
                    {(student.unread_comments ?? 0) > 0 && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-[#F39C12] text-xs">
                        <MessageCircle size={14} />
                        <span>{student.unread_comments} belum dibaca</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}