import React from 'react';
import { motion as m } from 'framer-motion';

const motion = m as any;

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
            Dynamic Flow, Zero Gaps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            No appointments. No fixed slots. Just a smart, self-correcting queue.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {/* Step 1: Scan */}
            <StepCard 
                step={1} 
                title="Scan to Join" 
                desc="Every customer—walk-in or expected—scans to enter the live queue. No fixed time slots."
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

            {/* Step 2: Dynamic Estimates */}
            <StepCard 
                step={2} 
                title="Dynamic Estimates" 
                desc="Receive a live wait time based on flow. If the line moves fast, your time updates instantly."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <PhoneFrame>
                        <div className="h-full bg-white flex flex-col p-4 relative items-center justify-center">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2">Est. Wait</span>
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1], color: ["#111827", "#3b82f6", "#111827"] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="text-4xl font-black text-gray-900"
                            >
                                12<span className="text-lg text-gray-400 font-medium">m</span>
                            </motion.div>
                            <div className="mt-4 flex gap-2">
                                <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-green-500/50" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Updating live...</p>
                        </div>
                    </PhoneFrame>
                </div>
            </StepCard>

            {/* Step 3: Smart Grace Period */}
            <StepCard 
                step={3} 
                title="Smart Grace Period" 
                desc="Turn arrived? You have 3 minutes. Miss it, and you're auto-moved to the back."
            >
                 <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                     <PhoneFrame>
                         {/* Alert Screen */}
                         <div className="h-full w-full bg-gray-900 relative p-4 flex flex-col items-center justify-center text-white overflow-hidden">
                             {/* Pulse BG */}
                             <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 bg-yellow-500/20" />
                             
                             <div className="text-yellow-400 mb-2">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                             </div>

                             <div className="text-lg font-bold mb-1">Your Turn!</div>
                             <div className="text-[10px] opacity-80 mb-4 text-center px-2">Please confirm arrival</div>

                             {/* Countdown */}
                             <div className="text-4xl font-mono font-bold text-yellow-400 tabular-nums">
                                 2:59
                             </div>
                             
                             <div className="mt-6 w-full h-10 bg-white text-gray-900 rounded-xl flex items-center justify-center text-xs font-bold">
                                 I'm Here
                             </div>
                         </div>
                     </PhoneFrame>
                 </div>
            </StepCard>

            {/* Step 4: Served */}
            <StepCard 
                step={4} 
                title="Zero Idle Time" 
                desc="We serve whoever is digitally present next. No gaps, no waiting for latecomers."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                     <PhoneFrame>
                         <div className="h-full bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            {/* Success Icon */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 relative z-10"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                                    <path d="M5 12l5 5L20 7" />
                                </svg>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="mt-4 text-sm font-bold text-gray-900 text-center"
                            >
                                Now Serving
                            </motion.div>
                            
                            {/* Flow lines */}
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute h-0.5 bg-blue-100 w-full left-0"
                                        style={{ top: `${20 + i * 30}%` }}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
                                    />
                                ))}
                            </div>
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