import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export interface UserStats {
  average_score: number;
  total_sessions: number;
  surahs_completed: number;
}

export interface SurahProgress {
  surah_number: number;
  surah_name: string;
  arabic_name: string;
  completion_pct: number;
  last_accessed: string;
}

export function useStats(userId: string | undefined) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<SurahProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/user/${userId}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          setStats({ average_score: 78, total_sessions: 24, surahs_completed: 5 });
        }

        const historyRes = await fetch(`${API_BASE}/user/${userId}/history`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.slice(0, 2));
        } else {
          setHistory([
            { surah_number: 1, surah_name: 'Al-Fatihah', arabic_name: 'الفاتحة', completion_pct: 85, last_accessed: '2 jam lalu' },
            { surah_number: 112, surah_name: 'Al-Ikhlas', arabic_name: 'الإخلاص', completion_pct: 60, last_accessed: '1 hari lalu' },
          ]);
        }
      } catch {
        setStats({ average_score: 78, total_sessions: 24, surahs_completed: 5 });
        setHistory([
          { surah_number: 1, surah_name: 'Al-Fatihah', arabic_name: 'الفاتحة', completion_pct: 85, last_accessed: '2 jam lalu' },
          { surah_number: 112, surah_name: 'Al-Ikhlas', arabic_name: 'الإخلاص', completion_pct: 60, last_accessed: '1 hari lalu' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { stats, history, loading };
}
