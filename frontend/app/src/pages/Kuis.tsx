import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MascotGuide from '@/components/MascotGuide';
import BottomNav from '@/components/BottomNav';
import gsap from 'gsap';

interface Question {
  text: string;
  arabic: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const questions: Question[] = [
  {
    text: 'Hukum bacaan apa yang terjadi pada nun sukun bertemu huruf ع?',
    arabic: 'مِنْ عَلِيمٍ',
    options: ['Ikhfa\'', 'Idzhar', 'Idgham', 'Iqlab'],
    correctIndex: 1,
    explanation: 'Nun sukun bertemu huruf ع termasuk Idzhar karena ع adalah huruf halqi (tenggorokan).',
  },
  {
    text: 'Berapa jumlah huruf Ikhfa\' Haqiqi?',
    arabic: 'نْ + 15 huruf',
    options: ['10 huruf', '12 huruf', '15 huruf', '20 huruf'],
    correctIndex: 2,
    explanation: 'Ikhfa\' Haqiqi terjadi ketika nun sukun bertemu 15 huruf tertentu.',
  },
  {
    text: 'Huruf qalqalah berjumlah?',
    arabic: 'ق ط ب ج د',
    options: ['3 huruf', '4 huruf', '5 huruf', '6 huruf'],
    correctIndex: 2,
    explanation: 'Huruf qalqalah ada 5: ق (qaf), ط (tho), ب (ba), ج (jim), د (dal).',
  },
  {
    text: 'Idgham Bilaghunnah hanya terjadi pada huruf?',
    arabic: 'ل dan ر',
    options: ['ي dan و', 'ل dan ر', 'م dan ن', 'ب dan ف'],
    correctIndex: 1,
    explanation: 'Idgham Bilaghunnah (tanpa dengung) hanya untuk huruf ل dan ر saja.',
  },
  {
    text: 'Iqlab terjadi ketika nun sukun bertemu huruf?',
    arabic: 'مِنْ بَعْدِ',
    options: ['م', 'و', 'ب', 'ي'],
    correctIndex: 2,
    explanation: 'Iqlab terjadi ketika nun sukun bertemu huruf ب, dibaca dengung seperti mim.',
  },
];

export default function Kuis() {
  const navigate = useNavigate();
  const [mascotMessage, setMascotMessage] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleMascotMessage = useCallback((msg: string) => {
    setMascotMessage(msg);
  }, []);

  useEffect(() => {
    handleMascotMessage('Pertanyaan pertama! Semangat! Pilih jawaban yang menurutmu benar!');
  }, [handleMascotMessage]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);

    const q = questions[currentQ];
    if (idx === q.correctIndex) {
      setCorrectCount(prev => prev + 1);
      handleMascotMessage('Mantap! Jawabanmu benar! Lanjut ke pertanyaan berikutnya!');
    } else {
      handleMascotMessage(`Jangan khawatir! Yang benar adalah: ${q.options[q.correctIndex]}. ${q.explanation}`);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      handleMascotMessage(`Pertanyaan ${currentQ + 2}! Fokus dan semangat!`);
    } else {
      setShowResult(true);
      const finalScore = Math.round(((correctCount + (selectedOption === questions[currentQ].correctIndex ? 1 : 0)) / questions.length) * 100);
      
      setTimeout(() => {
        let current = 0;
        const interval = setInterval(() => {
          current += 2;
          if (current >= finalScore) {
            current = finalScore;
            clearInterval(interval);
          }
          setScoreAnim(current);
        }, 20);

        if (finalScore >= 80) {
          handleMascotMessage(`Luar biasa! Kamu dapat ${finalScore}%! Kamu sudah menguasai tajwid ini!`);
        } else if (finalScore >= 60) {
          handleMascotMessage(`Bagus! Kamu dapat ${finalScore}%. Mari kita pelajari lagi bersama!`);
        } else {
          handleMascotMessage(`Jangan menyerah! Kamu dapat ${finalScore}%. Mari kita pelajari lagi dari awal!`);
        }
      }, 300);
    }
  };

  useEffect(() => {
    if (showResult && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
      );
    }
  }, [showResult]);

  const q = questions[currentQ];
  const isCorrect = selectedOption === q.correctIndex;
  const totalCorrect = correctCount + (answered && isCorrect ? 1 : 0);

  return (
    <div className="min-h-screen pb-56 lg:pb-12 lg:pl-20" style={{ background: '#0D1B2A' }}>
      <header
        className="sticky top-0 z-50 px-5 sm:px-8 h-16 sm:h-[72px] flex items-center gap-3"
        style={{
          background: 'rgba(13,27,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <ArrowLeft size={20} style={{ color: '#E8DCC4' }} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold flex-1" style={{ color: '#E8DCC4' }}>
          Kuis Tajwid
        </h1>
        <span className="text-sm sm:text-base" style={{ color: '#8B9DAF' }}>
          {Math.min(currentQ + (answered ? 1 : 0), questions.length)}/{questions.length}
        </span>
      </header>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 px-5">
        {questions.map((_, idx) => {
          let status: 'pending' | 'answered-correct' | 'answered-wrong' | 'current' = 'pending';
          if (idx < currentQ) {
            status = 'answered-correct';
          } else if (idx === currentQ) {
            status = answered ? (isCorrect ? 'answered-correct' : 'answered-wrong') : 'current';
          }
          return (
            <div
              key={idx}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300"
              style={{
                background:
                  status === 'answered-correct' ? '#4ADE80' :
                  status === 'answered-wrong' ? '#F87171' :
                  status === 'current' ? '#D4AF37' : '#2A3F54',
                transform: status === 'current' ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>

      <main className="app-container pt-6 sm:pt-8">
        {!showResult ? (
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-5 sm:p-6 lg:p-8 mb-5 sm:mb-6">
              <p className="text-base sm:text-lg lg:text-xl mb-3 sm:mb-4 leading-relaxed" style={{ color: '#E8DCC4' }}>
                {q.text}
              </p>
              <div
                className="rounded-xl p-4 sm:p-6 text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="font-arabic text-2xl sm:text-3xl lg:text-4xl" style={{ color: '#F5E6C4' }}>
                  {q.arabic}
                </span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {q.options.map((opt, idx) => {
                let bg = 'rgba(255,255,255,0.03)';
                let border = '1px solid rgba(255,255,255,0.08)';
                if (answered) {
                  if (idx === q.correctIndex) {
                    bg = 'rgba(74,222,128,0.1)';
                    border = '1px solid rgba(74,222,128,0.3)';
                  } else if (idx === selectedOption && idx !== q.correctIndex) {
                    bg = 'rgba(248,113,113,0.1)';
                    border = '1px solid rgba(248,113,113,0.3)';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={answered}
                    className="w-full text-left glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all duration-200 hover:border-white/15"
                    style={{
                      background: bg,
                      border,
                      opacity: answered && idx !== selectedOption && idx !== q.correctIndex ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: answered && idx === q.correctIndex
                          ? 'rgba(74,222,128,0.2)'
                          : answered && idx === selectedOption
                          ? 'rgba(248,113,113,0.2)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <span className="text-sm sm:text-base font-semibold" style={{ color: '#8B9DAF' }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg" style={{ color: '#E8DCC4' }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="mt-4 sm:mt-6 animate-pop-in">
                <div className="glass-card p-4 sm:p-5" style={{ borderLeft: `3px solid ${isCorrect ? '#4ADE80' : '#FBBF24'}` }}>
                  <p className="text-sm sm:text-base font-semibold mb-1" style={{ color: isCorrect ? '#4ADE80' : '#FBBF24' }}>
                    {isCorrect ? '✓ Benar!' : 'Penjelasan:'}
                  </p>
                  <p className="text-sm sm:text-base" style={{ color: '#8B9DAF' }}>{q.explanation}</p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full mt-4 sm:mt-5 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all hover:opacity-90 hover:scale-[0.99]"
                  style={{
                    background: '#D4AF37',
                    color: '#0D1B2A',
                  }}
                >
                  {currentQ < questions.length - 1 ? 'Pertanyaan Selanjutnya →' : 'Lihat Hasil'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div ref={resultRef} className="text-center py-8 sm:py-12 max-w-lg mx-auto">
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto flex items-center justify-center mb-6 sm:mb-8"
              style={{
                background: `conic-gradient(#D4AF37 ${scoreAnim * 3.6}deg, #2A3F54 0deg)`,
                position: 'relative',
              }}
            >
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center"
                style={{ background: '#0D1B2A' }}
              >
                <span className="text-3xl sm:text-4xl font-bold gold-text-gradient">
                  {scoreAnim}%
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: '#E8DCC4' }}>
              {scoreAnim >= 80 ? 'Luar Biasa!' : scoreAnim >= 60 ? 'Bagus!' : 'Terus Berlatih!'}
            </h2>
            <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: '#8B9DAF' }}>
              Kamu menjawab {totalCorrect} dari {questions.length} pertanyaan dengan benar
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentQ(0);
                  setSelectedOption(null);
                  setShowResult(false);
                  setCorrectCount(0);
                  setAnswered(false);
                  setScoreAnim(0);
                  handleMascotMessage('Ayo coba lagi! Kamu pasti bisa lebih baik!');
                }}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base glass-card-hover"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#E8DCC4',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Coba Lagi
              </button>
              <button
                onClick={() => navigate('/belajar')}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all hover:opacity-90"
                style={{
                  background: '#D4AF37',
                  color: '#0D1B2A',
                }}
              >
                Kembali ke Belajar
              </button>
            </div>
          </div>
        )}
      </main>

      <MascotGuide message={mascotMessage} />
      <BottomNav />
    </div>
  );
}
