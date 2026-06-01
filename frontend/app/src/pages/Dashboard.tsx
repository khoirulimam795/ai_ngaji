import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import GreetingCard from '@/components/GreetingCard';
import StatsRow from '@/components/StatsRow';
import MenuCards from '@/components/MenuCards';
import ProgressSection from '@/components/ProgressSection';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/hooks/useUser';
import { useStats } from '@/hooks/useStats';

export default function Dashboard() {
  const { user } = useUser();
  const { stats, history, loading } = useStats(user?.id);
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

        {/* Desktop Layout: Stats + Menu side by side on large screens */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-6 mt-4 lg:mt-6">
          {/* Left column: Stats + Progress */}
          <div className="lg:col-span-3">
            <StatsRow stats={stats} loading={loading} onMascotMessage={handleMascotMessage} />
            <div className="mt-4 lg:mt-6">
              <ProgressSection history={history} onMascotMessage={handleMascotMessage} />
            </div>
          </div>

          {/* Right column: Menu Cards */}
          <div className="lg:col-span-2 mt-4 lg:mt-0">
            <MenuCards onMascotMessage={handleMascotMessage} />
          </div>
        </div>
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}
