// src/hooks/useStats.ts
import { useState, useEffect } from 'react';

import { API_BASE } from '../lib/api';
// const API_BASE = 'https://wand-prowling-overstep.ngrok-free.dev';

export interface UserStats {
  total_sessions: number;
  avg_accuracy: number;
  best_accuracy: number;
  total_correct: number;
  total_wrong: number;
  total_checks: number;
}

export interface SessionHistory {
  id: number;
  surah: number;
  surah_name: string;
  accuracy: number;
  correct_count: number;
  wrong_count: number;
  created_at: string;
  teacher_comment?: string | null;   // <-- TAMBAHKAN INI
  comment_read_at?: string | null;   // <-- TAMBAHKAN INI
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
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/user/${userId}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats); // karena backend return { stats: ... }
        } else {
          throw new Error('Stats fetch failed');
        }

        const historyRes = await fetch(`${API_BASE}/user/${userId}/history?limit=10`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        } else {
          throw new Error('History fetch failed');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Optional: fallback mock data
        setStats({
          total_sessions: 0,
          avg_accuracy: 0,
          best_accuracy: 0,
          total_correct: 0,
          total_wrong: 0,
          total_checks: 0
        });
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { stats, history, loading };
}