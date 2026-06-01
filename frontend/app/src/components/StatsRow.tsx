import { Trophy, BookOpen, CheckCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { UserStats } from '@/hooks/useStats';

interface StatsRowProps {
  stats: UserStats | null;
  loading: boolean;
  onMascotMessage: (msg: string) => void;
}

export default function StatsRow({ stats, loading, onMascotMessage }: StatsRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && stats) {
      const cards = containerRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.15, ease: 'power2.out', delay: 0.5 }
      );
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-4 lg:p-6 h-24 lg:h-28 animate-shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: Trophy,
      iconColor: '#D4AF37',
      value: stats?.average_score ?? 0,
      suffix: ' / 100',
      label: 'Rata-rata Skor',
      desc: 'dari 100',
    },
    {
      icon: BookOpen,
      iconColor: '#8B9DAF',
      value: stats?.total_sessions ?? 0,
      suffix: '',
      label: 'Total Sesi',
      desc: 'latihan selesai',
    },
    {
      icon: CheckCircle,
      iconColor: '#4ADE80',
      value: stats?.surahs_completed ?? 0,
      suffix: '',
      label: 'Surat Selesai',
      desc: 'surat dilancarkan',
    },
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-3 lg:gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="stat-card glass-card p-4 lg:p-6 glass-card-hover cursor-pointer"
          onMouseEnter={() => onMascotMessage(`Kartu "${item.label}" menunjukkan ${item.desc.toLowerCase()}!`)}
        >
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <div
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${item.iconColor}20` }}
            >
              <item.icon size={16} className="lg:w-5 lg:h-5" style={{ color: item.iconColor }} />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-bold" style={{ color: item.iconColor }}>
            {item.value}{item.suffix}
          </div>
          <div className="text-xs lg:text-sm mt-1 lg:mt-2" style={{ color: '#8B9DAF' }}>
            {item.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
