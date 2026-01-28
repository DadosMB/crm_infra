
import React from 'react';
import { Rocket } from 'lucide-react';

interface PerformanceToggleProps {
  isActive: boolean;
  toggle: () => void;
}

export const PerformanceToggle: React.FC<PerformanceToggleProps> = ({ isActive, toggle }) => {
  return (
    <div className="flex items-center gap-2 group">
      {/* Tooltip Label (Optional/External context usually handles this, but added for clarity on hover) */}
      
      <button
        onClick={toggle}
        className={`
          relative w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out shadow-inner overflow-hidden border
          ${isActive 
              ? 'bg-gradient-to-r from-orange-400 to-red-600 border-orange-500/50 shadow-orange-500/20' 
              : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
          }
        `}
        aria-label="Alternar Modo Turbo"
        title={isActive ? "Modo Turbo Ativado" : "Ativar Modo Turbo"}
      >
        {/* --- Motion Effects (Speed Lines) --- */}
        {/* Only visible when Active */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
            {/* Wind Line 1 */}
            <div className="absolute top-[30%] left-[10%] w-3 h-[2px] bg-white/40 rounded-full animate-[pulse_0.5s_infinite]"></div>
            {/* Wind Line 2 */}
            <div className="absolute bottom-[30%] left-[20%] w-5 h-[2px] bg-white/30 rounded-full animate-[pulse_0.7s_infinite]"></div>
            {/* Wind Line 3 */}
            <div className="absolute top-[60%] left-[5%] w-2 h-[1px] bg-white/50 rounded-full animate-[pulse_0.4s_infinite]"></div>
        </div>

        {/* --- The Knob with Rocket --- */}
        <div
          className={`
            relative w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-10
            ${isActive ? 'translate-x-6 shadow-orange-700/20' : 'translate-x-0'}
          `}
        >
          <Rocket 
            size={14} 
            className={`
                transition-all duration-500 
                ${isActive 
                    ? 'text-orange-600 rotate-45 scale-110 ml-0.5 mb-0.5' // Flying Position (Forward & Tilted)
                    : 'text-slate-400 -rotate-45' // Parked Position (Upright)
                }
            `} 
            strokeWidth={2.5}
          />
        </div>
      </button>
    </div>
  );
};
