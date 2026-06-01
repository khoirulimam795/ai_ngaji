// src/lib/api.ts
const API_BASE = 'http://localhost:8000';

export const api = {
  // Daftar surat
  getSurahs: async () => {
    const res = await fetch(`${API_BASE}/surahs`);
    return res.json();
  },
  
  // Daftar ayat per surat
  getAyat: async (surahNumber: number) => {
    const res = await fetch(`${API_BASE}/ayat/${surahNumber}`);
    return res.json();
  },
  
  // Analisis audio
  analyzeAudio: async (surah: number, file: File) => {
    const formData = new FormData();
    formData.append('surah', surah.toString());
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  
  // Simpan session user
  saveSession: async (userId: string, data: any) => {
    const res = await fetch(`${API_BASE}/user/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...data }),
    });
    return res.json();
  },
  
  // Ambil statistik user
  getStats: async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/${userId}/stats`);
    return res.json();
  },
  
  // Ambil history user
  getHistory: async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/${userId}/history`);
    return res.json();
  }
};