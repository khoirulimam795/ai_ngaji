import { Flame } from 'lucide-react';
import { useGreeting } from '@/hooks/useUser';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GreetingCardProps {
  userName: string;
  streak: number;
  onMascotMessage: (msg: string) => void;
}

export default function GreetingCard({ userName, streak, onMascotMessage }: GreetingCardProps) {
  const greeting = useGreeting();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 }
      );
    }
    const timer = setTimeout(() => {
      onMascotMessage(`Assalamu'alaikum, ${userName}! Ayo mulai belajar tajwid hari ini!`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [userName, onMascotMessage]);

  return (
    <div ref={cardRef} className="glass-card p-5 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="relative z-10 lg:max-w-[70%]">
        <p className="text-sm sm:text-base mb-1 lg:mb-2" style={{ color: '#8B9DAF' }}>
          {greeting},
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-3" style={{ color: '#E8DCC4' }}>
          {userName}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg" style={{ color: '#8B9DAF' }}>
          Mari perbanyak membaca Al-Qur'an hari ini
        </p>

        {streak > 0 && (
          <div className="flex items-center gap-2 mt-3 lg:mt-4">
            <Flame size={18} className="lg:w-5 lg:h-5" style={{ color: '#FBBF24' }} />
            <span className="text-sm sm:text-base font-semibold fire-gradient">
              {streak} hari berturut-turut
            </span>
          </div>
        )}
      </div>

      <img
        src="/mascot.png"
        alt="Mascot"
        className="absolute -bottom-4 -right-2 sm:right-4 lg:right-8 w-24 sm:w-28 lg:w-36 h-auto animate-mascot-idle pointer-events-none"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
      />
    </div>
  );
}
