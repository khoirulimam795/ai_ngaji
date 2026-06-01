import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface MascotGuideProps {
  message: string;
}

export default function MascotGuide({ message }: MascotGuideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const prevMessageRef = useRef('');

  // Entrance animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 0.8 }
      );
    }
    if (bubbleRef.current) {
      gsap.fromTo(
        bubbleRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 1.0 }
      );
    }
  }, []);

  // Typewriter effect when message changes
  useEffect(() => {
    if (!message || message === prevMessageRef.current) return;
    prevMessageRef.current = message;

    setIsTyping(true);
    setDisplayedText('');

    let i = 0;
    const interval = setInterval(() => {
      if (i <= message.length) {
        setDisplayedText(message.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    // Pop bubble animation
    if (bubbleRef.current) {
      gsap.fromTo(
        bubbleRef.current,
        { scale: 0.8 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
      );
    }

    return () => clearInterval(interval);
  }, [message]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 lg:bottom-8 left-0 right-0 lg:left-auto lg:right-8 z-40 pointer-events-none"
    >
      <div className="app-container lg:max-w-md flex items-end gap-3 lg:flex-row-reverse">
        {/* Speech Bubble */}
        <div
          ref={bubbleRef}
          className="speech-bubble flex-1 lg:flex-initial px-4 py-3 mb-2 lg:mb-0 lg:mr-3"
        >
          <span ref={textRef} className="text-sm lg:text-base" style={{ color: '#E8DCC4' }}>
            {displayedText}
          </span>
          {isTyping && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle"
              style={{
                background: '#D4AF37',
                animation: 'typewriter-cursor 0.7s step-end infinite',
              }}
            />
          )}
        </div>

        {/* Mascot Image */}
        <div className="flex-shrink-0 w-20 lg:w-24 pointer-events-auto" style={{ marginBottom: '-4px' }}>
          <img
            src="/mascot.png"
            alt="AI Ngaji Guide"
            className="w-full h-auto animate-mascot-idle drop-shadow-lg"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
