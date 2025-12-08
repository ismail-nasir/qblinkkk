import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-20 relative z-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Simple as 1-2-3-4
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            A seamless experience for your customers from start to finish.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {/* Step 1: Scan */}
            <StepCard 
                step={1} 
                title="Scan QR" 
                desc="Customers scan a code. No app download required."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="w-24 h-24 bg-white p-2 rounded-lg grid grid-cols-6 gap-1 opacity-50 absolute">
                        {[...Array(36)].map((_, i) => (
                            <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-gray-800' : 'bg-transparent'}`} />
                        ))}
                    </div>
                    <PhoneFrame>
                         {/* Scanning UI */}
                         <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] z-10">
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent w-full h-full animate-pulse"></div>
                             <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]" />
                             
                             {/* Camera Corners */}
                             <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg"></div>
                             <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg"></div>
                             <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg"></div>
                             <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg"></div>
                         </div>
                    </PhoneFrame>
                </div>
            </StepCard>

            {/* Step 2: Join */}
            <StepCard 
                step={2} 
                title="Join" 
                desc="They enter their name to secure a spot in line."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <PhoneFrame>
                        <div className="h-full bg-white flex flex-col p-4 relative">
                            {/* App Header */}
                            <div className="h-4 w-1/3 bg-gray-100 rounded-full mb-6"></div>
                            
                            {/* Input Field Animation */}
                            <div className="space-y-2 mb-auto">
                                <div className="h-2 w-1/4 bg-gray-100 rounded-full"></div>
                                <motion.div 
                                    initial={{ width: "30%" }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                                    className="h-10 bg-gray-50 rounded-xl border border-gray-200 flex items-center px-3"
                                >
                                    <div className="w-0.5 h-4 bg-primary-500 animate-pulse"></div>
                                </motion.div>
                            </div>
                            
                            {/* Button Press Animation */}
                            <motion.div 
                                animate={{ scale: [1, 0.95, 1] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                className="h-10 w-full bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 mt-4"
                            >
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Join Queue</span>
                            </motion.div>

                            {/* Finger Tap */}
                            <motion.div
                                animate={{ scale: [1, 0.8, 1], x: [10, 0, 10], y: [10, 0, 10], opacity: [0, 1, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                className="absolute bottom-6 right-10 w-8 h-8 bg-gray-900/20 rounded-full z-20 pointer-events-none blur-[2px]"
                            />
                        </div>
                    </PhoneFrame>
                </div>
            </StepCard>

            {/* Step 3: Wait */}
            <StepCard 
                step={3} 
                title="Wait" 
                desc="Real-time updates keep them informed while they shop."
            >
                 <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                     <PhoneFrame>
                         {/* Lock Screen Wallpaper */}
                         <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 relative p-4 flex flex-col items-center pt-8 text-white">
                             {/* Time */}
                             <div className="text-4xl font-thin tracking-tighter mb-1">09:41</div>
                             <div className="text-[10px] font-medium opacity-80 mb-8">Wednesday, Jan 20</div>

                             {/* Notification */}
                             <motion.div
                                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                                whileInView={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
                                className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20 flex items-start gap-3"
                             >
                                 <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
                                     <span className="text-primary-600 text-xs font-bold">Q</span>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-baseline mb-0.5">
                                         <span className="text-[10px] font-bold">Qblink</span>
                                         <span className="text-[8px] opacity-70">Now</span>
                                     </div>
                                     <p className="text-[10px] leading-tight font-medium">It's almost your turn! You are 3rd in line.</p>
                                 </div>
                             </motion.div>
                         </div>
                     </PhoneFrame>
                 </div>
            </StepCard>

            {/* Step 4: Served */}
            <StepCard 
                step={4} 
                title="Served" 
                desc="They arrive exactly when it's their turn."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                     <PhoneFrame>
                         <div className="h-full bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            {/* Success Icon */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="mt-6 text-sm font-bold text-gray-900 uppercase tracking-widest text-center"
                            >
                                You're Up!
                            </motion.div>

                             {/* Confetti Particles */}
                             {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ 
                                        y: [0, -100],
                                        x: [0, (i % 2 === 0 ? 20 : -20)],
                                        opacity: [1, 0],
                                        rotate: [0, 180] 
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                                    className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-sm ${i % 2 === 0 ? 'bg-blue-400' : 'bg-yellow-400'}`}
                                />
                             ))}
                         </div>
                     </PhoneFrame>
                </div>
            </StepCard>
        </div>
      </div>
    </section>
  );
};

// Reusable Dark Phone Frame to match "Step 1" style
const PhoneFrame = ({ children }: { children?: React.ReactNode }) => (
    <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-36 h-64 border-[6px] border-gray-800 rounded-[32px] bg-gray-800 overflow-hidden shadow-2xl"
    >
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-12 bg-gray-800 rounded-b-xl z-30"></div>
        
        {/* Screen Area */}
        <div className="absolute inset-0 bg-gray-900 overflow-hidden rounded-[26px]">
            {children}
        </div>
        
        {/* Glass Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-40 rounded-[26px]"></div>
    </motion.div>
);

const StepCard = ({ step, title, desc, children }: { step: number, title: string, desc: string, children?: React.ReactNode }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: step * 0.1 }}
        className="flex flex-col gap-4 group"
    >
        <div className="relative aspect-[4/5] w-full rounded-[32px] overflow-hidden bg-gray-100 shadow-sm border border-gray-100 group-hover:shadow-xl group-hover:shadow-blue-900/5 transition-all duration-500">
             {children}
             
             {/* Number Badge */}
             <div className="absolute top-4 left-4 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center font-bold text-gray-900 shadow-sm border border-white z-20">
                 {step}
             </div>
        </div>
        <div className="px-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

export default HowItWorks;