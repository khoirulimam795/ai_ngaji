import { useState, useEffect } from 'react';

export interface UserData {
  id: string;
  name: string;
  streak: number;
  avatar?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    let userId = localStorage.getItem('ngaji_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('ngaji_user_id', userId);
    }

    let userName = localStorage.getItem('ngaji_user_name');
    if (!userName) {
      userName = 'Pembaca';
      localStorage.setItem('ngaji_user_name', userName);
    }

    let streak = parseInt(localStorage.getItem('ngaji_streak') || '0', 10);

    setUser({
      id: userId,
      name: userName,
      streak,
    });
  }, []);

  const updateName = (name: string) => {
    localStorage.setItem('ngaji_user_name', name);
    setUser(prev => prev ? { ...prev, name } : null);
  };

  return { user, updateName };
}

export function useGreeting() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      setGreeting('Selamat Pagi');
    } else if (hour >= 11 && hour < 15) {
      setGreeting('Selamat Siang');
    } else if (hour >= 15 && hour < 18) {
      setGreeting('Selamat Sore');
    } else {
      setGreeting('Selamat Malam');
    }
  }, []);

  return greeting;
}
