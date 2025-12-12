import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

const motion = m as any;

interface PhoneMockupProps {
  children: React.ReactNode;
  variant: 'left' | 'right';
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ children, variant }) => {
  // Isolate transformation logic
  const transformClass = variant === 'left' 
    ? 'rotate-y-12 rotate-z-[-5deg] translate-y-4' 
    : '-rotate-y-12 rotate-z-[5deg] -translate-y-4';

  const shadowColor = variant === 'left' ? 'shadow-indigo-500/20' : 'shadow-emerald-500/20';

  return (
    <div className={`relative w-[280px] h-[580px] transition-transform duration-700 ease-in-out transform hover:scale-105 ${transformClass}`}>
      {/* The Phone Bezel */}
      <div className={`
        absolute inset-0 
        bg-gray-900 
        rounded-[48px] 
        border-[6px] border-gray-800 
        shadow-2xl ${shadowColor}
        overflow-hidden
      `}>
        {/* The Screen */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white overflow-hidden flex flex-col">
          {/* Status Bar Mock */}
          <div className="h-6 w-full flex justify-between px-6 items-center pt-2 z-20">
            <div className="text-[10px] font-bold text-gray-800">9:41</div>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-gray-800 rounded-sm"></div>
            </div>
          </div>
          
          {/* Dynamic Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={React.isValidElement(children) ? (children.key as string) : 'content'}
              className="flex-1 relative flex flex-col h-full"
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1] // Smooth premium curve
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full z-20"></div>
        </div>
      </div>
      
      {/* Reflection/Gloss */}
      <div className="absolute inset-0 rounded-[48px] bg-gradient-to-tr from-white/20 to-transparent pointer-events-none z-10"></div>
    </div>
  );
};

export default PhoneMockup;