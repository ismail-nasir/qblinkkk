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
                    {/* QR Code Background */}
                    <div className="w-24 h-24 bg-white p-2 rounded-lg grid grid-cols-6 gap-1 opacity-50">
                        {[...Array(36)].map((_, i) => (
                            <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-gray-800' : 'bg-transparent'}`} />
                        ))}
                    </div>
                    {/* Scanning Phone */}
                    <motion.div
                        animate={{ y: [-15, 15, -15] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-28 h-44 border-[6px] border-gray-800 rounded-[24px] bg-gray-900/5 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden shadow-2xl"
                    >
                         {/* Scanning Laser */}
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent w-full h-full animate-pulse"></div>
                         <div className="w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] relative z-10" />
                         
                         {/* Screen Reflection */}
                         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                    </motion.div>
                </div>
            </StepCard>

            {/* Step 2: Join */}
            <StepCard 
                step={2} 
                title="Join" 
                desc="They enter their name to secure a spot in line."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    {/* Phone Mockup */}
                    <div className="w-32 h-52 bg-white border-4 border-gray-100 rounded-[20px] shadow-sm flex flex-col p-3 gap-3 overflow-hidden relative">
                         {/* Header */}
                         <div className="h-2 w-1/2 bg-gray-100 rounded-full mb-2"></div>
                         {/* Input Field Animation */}
                         <motion.div 
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-8 bg-gray-50 rounded-lg border border-gray-200"
                         />
                         
                         {/* Button Press Animation */}
                         <div className="mt-auto">
                            <motion.div 
                                animate={{ scale: [1, 0.95, 1] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                className="h-8 w-full bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/20"
                            >
                                <span className="text-[8px] font-bold text-white uppercase tracking-wider">Join Queue</span>
                            </motion.div>
                         </div>

                         {/* Tap Finger */}
                         <motion.div
                            animate={{ scale: [1, 0.8, 1], x: [10, 0, 10], y: [10, 0, 10], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            className="absolute bottom-5 right-8 w-8 h-8 bg-gray-900/80 rounded-full z-20 pointer-events-none blur-[1px]"
                         />
                    </div>
                </div>
            </StepCard>

            {/* Step 3: Wait */}
            <StepCard 
                step={3} 
                title="Wait" 
                desc="Real-time updates keep them informed while they shop."
            >
                 <div className="absolute inset-0 flex items-center justify-center bg-blue-50/30">
                     {/* Phone Mockup */}
                    <div className="w-32 h-52 bg-white border-4 border-gray-100 rounded-[20px] shadow-sm relative overflow-hidden flex flex-col items-center pt-8">
                         {/* Wallpaper */}
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white z-0"></div>
                         
                         {/* Clock */}
                         <div className="z-10 text-center mb-4">
                             <div className="h-6 w-16 bg-gray-200 rounded-md mx-auto mb-1 opacity-50"></div>
                             <div className="h-2 w-24 bg-gray-100 rounded-full mx-auto"></div>
                         </div>

                         {/* Notification Pop */}
                         <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                            className="w-[90%] bg-white/80 backdrop-blur-md rounded-xl p-2 shadow-lg border border-gray-100 z-10 flex items-center gap-2"
                         >
                             <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                 <motion.div 
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.5 }}
                                    className="text-[10px]"
                                 >
                                     🔔
                                 </motion.div>
                             </div>
                             <div className="flex-1 space-y-1">
                                 <div className="h-1.5 w-16 bg-gray-800 rounded-full"></div>
                                 <div className="h-1 w-10 bg-gray-300 rounded-full"></div>
                             </div>
                         </motion.div>
                    </div>
                 </div>
            </StepCard>

            {/* Step 4: Served */}
            <StepCard 
                step={4} 
                title="Served" 
                desc="They arrive exactly when it's their turn."
            >
                <div className="absolute inset-0 flex items-center justify-center bg-green-50/30">
                     {/* Phone Mockup */}
                     <div className="w-32 h-52 bg-white border-4 border-gray-100 rounded-[20px] shadow-sm relative overflow-hidden flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 text-[10px] font-bold text-gray-900 uppercase tracking-widest text-center"
                        >
                            You're Up!
                        </motion.div>

                        {/* Confetti / Rings */}
                        <motion.div
                             animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity }}
                             className="absolute w-16 h-16 bg-green-400 rounded-full opacity-20 z-0"
                        />
                         <motion.div
                             animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                             className="absolute w-16 h-16 bg-green-300 rounded-full opacity-20 z-0"
                        />
                     </div>
                </div>
            </StepCard>
        </div>
      </div>
    </section>
  );
};

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