import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(13,27,42,0.9)' : '#0D1B2A',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="app-container flex items-center justify-between h-16 sm:h-[72px]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="text-xl sm:text-2xl font-bold tracking-tight lg:text-[1.75rem]"
            style={{ color: '#D4AF37', fontFamily: "'Nunito', sans-serif" }}
          >
            AI<span className="text-[0.6em] sm:text-[0.65em]" style={{ fontSize: '0.65em', verticalAlign: 'super' }}>Nga</span>ji
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-sm sm:text-base hidden xs:inline" style={{ color: '#8B9DAF' }}>
            {userName}
          </span>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              border: '2px solid rgba(212,175,55,0.3)',
              background: 'linear-gradient(135deg, #1B2838 0%, #2A3F54 100%)',
            }}
          >
            <User size={18} className="sm:w-5 sm:h-5" style={{ color: '#D4AF37' }} />
          </div>
        </div>
      </div>
    </header>
  );
}
