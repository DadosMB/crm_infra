
import React from 'react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-16 h-8 rounded-full cursor-pointer transition-colors duration-500 ease-in-out shadow-inner overflow-hidden border border-black/5 dark:border-white/10
        ${isDark ? 'bg-[#1e293b]' : 'bg-[#60a5fa]'}
      `}
      aria-label="Alternar Tema"
    >
      {/* --- BACKGROUND ELEMENTS --- */}
      
      {/* Stars (Dark Mode Only) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[20%] left-[20%] w-[2px] h-[2px] bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[50%] left-[40%] w-[1px] h-[1px] bg-white rounded-full opacity-70"></div>
        <div className="absolute bottom-[20%] left-[25%] w-[1.5px] h-[1.5px] bg-white rounded-full animate-pulse delay-75"></div>
        <div className="absolute top-[15%] right-[40%] w-[1px] h-[1px] bg-white rounded-full opacity-60"></div>
        <div className="absolute bottom-[40%] right-[30%] w-[2px] h-[2px] bg-white rounded-full animate-pulse delay-150"></div>
      </div>

      {/* Clouds (Light Mode Only) */}
      <div className={`absolute inset-0 transition-all duration-500 ${isDark ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="absolute bottom-[-2px] left-[15%] w-4 h-4 bg-white rounded-full opacity-90"></div>
        <div className="absolute bottom-[-4px] left-[30%] w-5 h-5 bg-white rounded-full opacity-80"></div>
        <div className="absolute bottom-[-1px] left-[45%] w-4 h-4 bg-white rounded-full opacity-90"></div>
        <div className="absolute bottom-[20%] left-[60%] w-3 h-3 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-[20%] left-[30%] w-6 h-2 bg-white rounded-full opacity-30 blur-[1px]"></div>
      </div>

      {/* --- THE KNOB (Sun / Moon) --- */}
      <div
        className={`
            absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-500 cubic-bezier(0.4, 0.0, 0.2, 1) z-10 flex items-center justify-center overflow-hidden
            ${isDark 
                ? 'left-[calc(100%-1.75rem)] bg-slate-200' // Moon Position & Color
                : 'left-1 bg-[#fbbf24]' // Sun Position & Color
            }
        `}
      >
        {/* Moon Craters (Visible only in Dark Mode) */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-[25%] left-[35%] w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
            <div className="absolute bottom-[30%] right-[25%] w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="absolute bottom-[15%] left-[40%] w-0.5 h-0.5 bg-slate-300 rounded-full"></div>
        </div>
        
        {/* Sun Halo/Glow (Visible only in Light Mode) - subtle inner ring */}
        <div className={`absolute inset-0 rounded-full border-[2px] border-orange-300/30 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}></div>
      </div>

    </button>
  );
};
