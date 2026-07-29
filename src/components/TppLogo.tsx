import React from 'react';

interface TppLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  darkMode?: boolean;
  className?: string;
}

export const TppLogo: React.FC<TppLogoProps> = ({
  variant = 'full',
  size = 'md',
  darkMode = false,
  className = ''
}) => {
  // Sizing definitions
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 🟠🟢 OFFICIAL TPP ICON MARK */}
      <div className={`${iconDimensions} shrink-0 relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5500] to-[#E04B00] shadow-md shadow-orange-500/20 p-1.5 transition-transform hover:scale-105`}>
        {/* Geometric ribbon T symbol */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
          {/* Top Fold Ribbon */}
          <path d="M15 40 L35 15 L35 40 Z" fill="#84CC16" />
          <path d="M35 15 L90 15 L90 40 L35 40 Z" fill="#FFFFFF" />
          {/* Stem Fold Ribbon */}
          <path d="M35 40 L55 20 L55 40 Z" fill="#E2E8F0" />
          <path d="M35 40 L55 40 L55 85 L35 85 Z" fill="#FFFFFF" />
        </svg>
        
        {/* Small Lime Accent Badge on top corner */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#84CC16] rounded-full border-2 border-slate-900 shadow-xs" />
      </div>

      {/* 📝 TPP HUB DIGITAL TEXT LOGO */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className={`font-black tracking-tight text-[#FF5500] ${textSize}`}>
              TPP
            </span>
            <span className={`font-black tracking-wider ${darkMode ? 'text-white' : 'text-slate-800'} ${textSize}`}>
              HUB
            </span>
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            DIGITAL
          </span>
        </div>
      )}
    </div>
  );
};
