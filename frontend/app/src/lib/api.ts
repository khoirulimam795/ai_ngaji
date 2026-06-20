const getApiBase = (): string => {
  const { hostname, protocol } = window.location;
  // Kalau bukan localhost → berarti diakses via ngrok atau domain lain
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}`;
  }
  // Local dev: frontend di port 3000/5173, backend di 8000
  return 'http://localhost:8000';
};

export const API_BASE = getApiBase();

export const api = {
  // ==========================================
  // EXISTING ENDPOINTS (Ditambahkan support class_code)
  // ==========================================

  getSurahs: async () => {
    const res = await fetch(`${API_BASE}/surahs`);
    return res.json();
  },

  getAyat: async (surahNumber: number) => {
    const res = await fetch(`${API_BASE}/ayat/${surahNumber}`);
    return res.json();
  },

  // UPDATE: Tambahkan classCode opsional
  analyzeAudio: async (surah: number, file: File, classCode?: string) => {
    const formData = new FormData();
    formData.append('surah', surah.toString());

    // Ambil user_id dari localStorage sebagai fallback
    const userId = localStorage.getItem('ngaji_user_id') || 'unknown';
    formData.append('user_id', userId);
    formData.append('file', file);

    if (classCode) {
      formData.append('class_code', classCode);
    }

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // UPDATE: Tambahkan classCode opsional
  saveSession: async (userId: string, data: any, classCode?: string) => {
    const payload: any = { user_id: userId, ...data };
    if (classCode) {
      payload.class_code = classCode;
    }

    const res = await fetch(`${API_BASE}/user/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getStats: async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/${userId}/stats`);
    return res.json();
  },

  getHistory: async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/${userId}/history`);
    return res.json();
  },

  // ==========================================
  // NEW: PORTAL GURU ENDPOINTS
  // ==========================================

  // 1. Guru membuat kelas baru
  createClass: async (teacherId: string, className: string) => {
    const res = await fetch(`${API_BASE}/class/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: teacherId, class_name: className }),
    });
    return res.json();
  },

  // 2. Cek info kelas (untuk validasi kode)
  getClassInfo: async (classCode: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}`);
    return res.json();
  },

  // 3. Siswa join kelas
  joinClass: async (classCode: string, userId: string, displayName: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-ID': userId },
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName
      }), // <-- BARU
    }).then(res => res.json());
    return res;
  },

  // 4. Guru: Ambil daftar siswa di kelasnya
  getClassStudents: async (classCode: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/students`, {
      headers: { 'X-Teacher-ID': teacherId },
    });
    return res.json();
  },

  // 5. Guru: Ambil riwayat sesi detail seorang siswa
  getStudentSessions: async (classCode: string, userId: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/student/${userId}/sessions`, {
      headers: { 'X-Teacher-ID': teacherId },
    });
    return res.json();
  },

  // 6. Guru: Kirim komentar ke sesi siswa
  sendComment: async (sessionId: string, classCode: string, commentText: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/session/${sessionId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Teacher-ID': teacherId
      },
      body: JSON.stringify({ class_code: classCode, comment_text: commentText }),
    });
    return res.json();
  },

  // 7. Siswa: Tandai komentar sudah dibaca
  markCommentRead: async (sessionId: string, userId: string) => {
    const res = await fetch(`${API_BASE}/session/${sessionId}/comment/read`, {
      method: 'POST',
      headers: { 'X-User-ID': userId },
    });
    return res.json();
  },

  // 8. Siswa keluar dari kelas
  leaveClass: async (classCode: string, userId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/leave`, {
      method: 'POST',
      headers: { 'X-User-ID': userId },
    });
    return res.json();
  },

  // ==========================================
  // NEW: UPLOAD MATERI PDF (PORTAL GURU)
  // ==========================================
  uploadMaterial: async (classCode: string, file: File, teacherId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/class/${classCode}/material/upload`, {
      method: 'POST',
      headers: { 'X-Teacher-ID': teacherId },
      body: formData,
    });
    return res.json();
  },

  publishMaterial: async (classCode: string, data: any, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/material/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Teacher-ID': teacherId },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getClassMaterials: async (classCode: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/materials`);
    return res.json();
  },

  deleteMaterial: async (classCode: string, materialId: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/material/${materialId}`, {
      method: 'DELETE',
      headers: { 'X-Teacher-ID': teacherId },
    });
    return res.json();
  },

  // Ambil semua materi guru (untuk manage)
  getTeacherMaterials: async (classCode: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/materials/manage`, {
      headers: { 'X-Teacher-ID': teacherId },
    });
    return res.json();
  },

  // Update materi
  updateMaterial: async (classCode: string, materialId: string, data: any, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/material/${materialId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Teacher-ID': teacherId },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getStudentFullDetail: async (classCode: string, userId: string, teacherId: string) => {
    const res = await fetch(`${API_BASE}/class/${classCode}/student/${userId}/full`, {
      headers: { 'X-Teacher-ID': teacherId },
    });
    return res.json();
  },
};