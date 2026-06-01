import { Home, BookOpen, Mic, HelpCircle, BarChart2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/belajar', icon: BookOpen, label: 'Belajar' },
    { path: '/rekam', icon: Mic, label: 'Ngaji', center: true },
    { path: '/kuis', icon: HelpCircle, label: 'Kuis' },
    { path: '/progress', icon: BarChart2, label: 'Progress' },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: '#0D1B2A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            if (item.center) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="center-btn-elevated flex flex-col items-center justify-center -mt-5"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                    style={{
                      background: '#D4AF37',
                      boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
                    }}
                  >
                    <Icon size={24} color="white" />
                  </div>
                  <span
                    className="text-[10px] mt-1 font-medium"
                    style={{ color: isActive ? '#D4AF37' : '#4A5D70' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1 min-w-[56px] py-2 transition-all duration-200 hover:opacity-80"
              >
                <Icon
                  size={22}
                  style={{
                    color: isActive ? '#D4AF37' : '#4A5D70',
                    filter: isActive ? 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' : 'none',
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? '#D4AF37' : '#4A5D70' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Left Sidebar */}
      <nav
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col items-center py-6"
        style={{
          width: '80px',
          background: 'rgba(13,27,42,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="mb-10">
          <span
            className="text-lg font-bold"
            style={{ color: '#D4AF37', fontFamily: "'Nunito', sans-serif" }}
          >
            AI<span style={{ fontSize: '0.6em', verticalAlign: 'super' }}>N</span>
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            if (item.center) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 my-2"
                  style={{
                    background: '#D4AF37',
                    boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                  }}
                  title={item.label}
                >
                  <Icon size={22} color="white" />
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: isActive ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: isActive ? '#D4AF37' : '#4A5D70',
                }}
                title={item.label}
              >
                <Icon size={22} />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
