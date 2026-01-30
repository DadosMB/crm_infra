
import React from 'react';
import { Moon, Sun } from 'lucide-react';

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
        relative w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out shadow-inner overflow-hidden border
        ${isDark 
            ? 'bg-slate-900 border-slate-700 shadow-indigo-900/20' // Modo Dark: Fundo Escuro com Borda Escura
            : 'bg-slate-200 border-slate-300' // Modo Light: Fundo Cinza "Desligado"
        }
      `}
      aria-label="Alternar Tema"
      title={isDark ? "Modo Escuro Ativado" : "Ativar Modo Escuro"}
    >
      {/* --- Background Stars (Visible only in Dark Mode) --- */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[20%] left-[40%] w-[1px] h-[1px] bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[50%] left-[20%] w-[2px] h-[2px] bg-white/70 rounded-full"></div>
        <div className="absolute bottom-[30%] left-[30%] w-[1px] h-[1px] bg-white rounded-full animate-pulse delay-75"></div>
        <div className="absolute top-[20%] right-[40%] w-[1.5px] h-[1.5px] bg-blue-200 rounded-full opacity-80"></div>
      </div>

      {/* --- The Knob with Icons --- */}
      <div
        className={`
          relative w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-10
          ${isDark ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        {/* Sun Icon (Light Mode - Gray) */}
        <Sun 
          size={14} 
          className={`
              absolute transition-all duration-500 
              ${isDark 
                  ? 'opacity-0 rotate-90 scale-50' 
                  : 'opacity-100 rotate-0 scale-100 text-slate-400' // Sol Cinza
              }
          `} 
          fill="currentColor"
        />

        {/* Moon Icon (Dark Mode - Indigo/Blue with Fill) */}
        <Moon 
          size={14} 
          className={`
              absolute transition-all duration-500 
              ${isDark 
                  ? 'opacity-100 rotate-0 scale-100 text-indigo-500 fill-indigo-500' // Lua com "glow"
                  : 'opacity-0 -rotate-90 scale-50' 
              }
          `} 
        />
      </div>
    </button>
  );
};
