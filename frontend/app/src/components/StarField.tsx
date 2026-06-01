import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
}

export default function StarField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stars: Star[] = [];
    const count = window.innerWidth < 768 ? 60 : window.innerWidth < 1280 ? 120 : 180;

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.15,
        twinkleDuration: Math.random() * 3 + 2,
        twinkleDelay: Math.random() * 5,
      });
    }

    container.innerHTML = '';
    stars.forEach((star, i) => {
      const el = document.createElement('div');
      el.className = 'star';
      el.style.left = `${star.x}%`;
      el.style.top = `${star.y}%`;
      el.style.width = `${star.size}px`;
      el.style.height = `${star.size}px`;
      el.style.setProperty('--base-opacity', String(star.opacity));
      el.style.setProperty('--twinkle-duration', `${star.twinkleDuration}s`);
      el.style.setProperty('--twinkle-delay', `${star.twinkleDelay}s`);
      el.style.animationDelay = `${star.twinkleDelay}s`;
      if (i % 7 === 0) {
        el.style.background = '#D4AF37';
        el.style.opacity = '0.6';
      }
      container.appendChild(el);
    });

    const handleScroll = () => {
      if (container) {
        container.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };

    let rafId: number;
    const throttledScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
}
