import { BookOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { SurahProgress } from '@/hooks/useStats';

interface ProgressSectionProps {
  history: SurahProgress[];
  onMascotMessage: (msg: string) => void;
}

export default function ProgressSection({ history, onMascotMessage }: ProgressSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 1.0 }
      );
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            barsRef.current.forEach((bar, i) => {
              if (bar && history[i]) {
                gsap.to(bar, {
                  width: `${history[i].completion_pct}%`,
                  duration: 0.8,
                  ease: 'power2.out',
                  delay: i * 0.15,
                });
              }
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [history]);

  return (
    <div ref={containerRef}>
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <BookOpen size={18} className="lg:w-5 lg:h-5" style={{ color: '#D4AF37' }} />
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#E8DCC4' }}>
          Lanjutkan Hafalan
        </h3>
      </div>

      <div className="space-y-3 lg:space-y-4">
        {history.map((item, idx) => (
          <div
            key={item.surah_number}
            className="glass-card p-4 sm:p-5 lg:p-6 glass-card-hover cursor-pointer"
            onMouseEnter={() => onMascotMessage(`Surat ${item.surah_name} — sudah ${item.completion_pct}% selesai!`)}
          >
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <div className="flex items-center gap-3 lg:gap-4">
                <span className="font-arabic text-lg sm:text-xl lg:text-2xl" style={{ color: '#F5E6C4' }}>
                  {item.arabic_name}
                </span>
                <span className="text-sm sm:text-base" style={{ color: '#8B9DAF' }}>
                  {item.surah_name}
                </span>
              </div>
              <span className="text-sm sm:text-base font-semibold gold-text-gradient">
                {item.completion_pct}%
              </span>
            </div>

            <div
              className="w-full rounded-full overflow-hidden"
              style={{ background: '#2A3F54', height: '8px' }}
            >
              <div
                ref={(el) => { if (el) barsRef.current[idx] = el; }}
                className="progress-fill"
                style={{ width: '0%' }}
              />
            </div>

            <div className="text-xs sm:text-sm mt-2" style={{ color: '#4A5D70' }}>
              {item.last_accessed}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
