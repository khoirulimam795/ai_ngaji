import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import GreetingCard from '@/components/GreetingCard';
import MenuCards from '@/components/MenuCards';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/useUser';

export default function Dashboard() {
  const { user } = useUser();
  const [mascotMessage, setMascotMessage] = useState('');

  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);

  return (
    <div className="min-h-screen pb-28 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      <Header userName={user?.name || 'Pembaca'} />

      <main className="app-container pt-20 sm:pt-24 lg:pt-28 relative" style={{ zIndex: 1 }}>
        {/* Greeting Card */}
        <GreetingCard
          userName={user?.name || 'Pembaca'}
          streak={user?.streak || 0}
          onMascotMessage={handleMascotMessage}
        />

        {/* Menu Cards Section - Diubah agar selalu full width ke samping */}
        <div className="w-full mt-4 lg:mt-6">
          <MenuCards onMascotMessage={handleMascotMessage} />
        </div>
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}