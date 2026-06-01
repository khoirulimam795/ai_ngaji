import { BookOpen, HelpCircle, Mic, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MenuCardsProps {
  onMascotMessage: (msg: string) => void;
}

export default function MenuCards({ onMascotMessage }: MenuCardsProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.menu-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.7 }
      );
    }
  }, []);

  const handleBelajar = () => {
    onMascotMessage('Ayo pelajari hukum-hukum tajwid! Klik kartu hijau ini!');
    setTimeout(() => navigate('/belajar'), 400);
  };

  const handleKuis = () => {
    onMascotMessage('Uji pemahamanmu dengan kuis tajwid!');
    setTimeout(() => navigate('/kuis'), 400);
  };

  const handleRekam = () => {
    onMascotMessage('Rekam bacaanmu dan saya akan membantu memperbaikinya!');
    setTimeout(() => navigate('/rekam'), 400);
  };

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
      <button
        className="menu-card glass-card-active text-left p-4 sm:p-5 lg:p-6 glass-card-hover flex items-center gap-3 lg:gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.2) 0%, rgba(29,158,117,0.05) 100%)', border: '1px solid rgba(29,158,117,0.2)' }}
        onClick={handleBelajar}
        onMouseEnter={() => onMascotMessage('Kartu hijau ini untuk belajar tajwid!')}
      >
        <div
          className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#1D9E75' }}
        >
          <BookOpen size={22} className="lg:w-6 lg:h-6" color="white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-semibold lg:mb-1" style={{ color: '#E8DCC4' }}>Belajar Tajwid</div>
          <div className="text-xs sm:text-sm hidden sm:block" style={{ color: '#8B9DAF' }}>Pelajari hukum bacaan</div>
        </div>
        <ChevronRight size={16} className="hidden lg:block flex-shrink-0" style={{ color: '#8B9DAF' }} />
      </button>

      <button
        className="menu-card glass-card-active text-left p-4 sm:p-5 lg:p-6 glass-card-hover flex items-center gap-3 lg:gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(127,119,221,0.2) 0%, rgba(127,119,221,0.05) 100%)', border: '1px solid rgba(127,119,221,0.2)' }}
        onClick={handleKuis}
        onMouseEnter={() => onMascotMessage('Kartu ungu ini untuk menguji pemahamanmu!')}
      >
        <div
          className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#7F77DD' }}
        >
          <HelpCircle size={22} className="lg:w-6 lg:h-6" color="white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-semibold lg:mb-1" style={{ color: '#E8DCC4' }}>Kuis</div>
          <div className="text-xs sm:text-sm hidden sm:block" style={{ color: '#8B9DAF' }}>Uji pemahamanmu</div>
        </div>
        <ChevronRight size={16} className="hidden lg:block flex-shrink-0" style={{ color: '#8B9DAF' }} />
      </button>

      <button
        className="menu-card glass-card-active text-left p-4 sm:p-5 lg:p-6 glass-card-hover flex items-center gap-3 lg:gap-4 col-span-2 lg:col-span-1"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.2)' }}
        onClick={handleRekam}
        onMouseEnter={() => onMascotMessage('Kartu emas ini untuk merekam dan memperbaiki bacaan!')}
      >
        <div
          className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: '#D4AF37' }}
        >
          <Mic size={22} className="lg:w-6 lg:h-6" color="white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-semibold lg:mb-1" style={{ color: '#E8DCC4' }}>Koreksi Bacaan</div>
          <div className="text-xs sm:text-sm" style={{ color: '#8B9DAF' }}>Rekam & perbaiki bacaan</div>
        </div>
        <ChevronRight size={16} className="hidden lg:block flex-shrink-0" style={{ color: '#8B9DAF' }} />
      </button>
    </div>
  );
}
