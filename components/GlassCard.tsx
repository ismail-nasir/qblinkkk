import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        bg-white/70 
        backdrop-blur-xl 
        border border-white/40 
        shadow-glass 
        rounded-[32px] 
        ${hoverEffect ? 'transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;