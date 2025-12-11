
import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, LogOut, CheckCircle2 } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

// Lazy load the 3D scene so the rest of the app renders even if Three.js fails or loads slowly
const HeroScene = React.lazy(() => import('./HeroScene'));

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden selection:bg-primary-100 selection:text-primary-700">
      
      {/* 3D Background Scene */}
      <Suspense fallback={<div className="absolute inset-0 bg-blue-50/20" />}>
         <div className="absolute inset-0 z-0">
            <HeroScene />
         </div>
      </Suspense>

      {/* Legacy Gradients (Lower opacity for 3D visibility) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4 animate-pulse pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-glass mb-8"
            >
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              <span className="text-xs font-extrabold tracking-widest text-gray-500 uppercase">Live Queue System</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-8xl font-black text-gray-900 leading-[0.95] mb-8 tracking-tighter"
            >
              Queue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 drop-shadow-sm">Smarter.</span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-2xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20"
            >
              Transform waiting into a seamless experience. <br className="hidden md:block"/>
              Zero friction. No apps required.
            </motion.p>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <motion.button 
                onClick={onGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-full sm:w-auto h-16 px-10 rounded-2xl bg-gray-900/90 backdrop-blur-xl text-white font-bold text-lg shadow-2xl shadow-gray-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 overflow-hidden border border-gray-700"
              >
                <span className="relative z-10 flex items-center gap-2">Start for Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></span>
                
                {/* Button Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3 text-sm font-bold text-gray-500"
            >
               <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white">
                  <CheckCircle2 size={18} className="text-green-500" /> No credit card
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white">
                  <CheckCircle2 size={18} className="text-green-500" /> 30-second setup
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white">
                  <CheckCircle2 size={18} className="text-green-500" /> Forever free
              </div>
            </motion.div>
          </div>

          {/* Right Visual - Phone Mockup */}
          <div className="lg:w-1/2 w-full flex justify-center lg:justify-end perspective-1000 mt-12 lg:mt-0 relative z-10 px-4 md:px-0">
            <motion.div 
              initial={{ opacity: 0, rotateY: -10, x: 50 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 0.8, type: "spring", damping: 20 }}
            >
              <PhoneMockup variant="left">
                 <div key="mockup-content" className="h-full bg-gray-50 flex flex-col font-sans relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

                     {/* Header */}
                     <div className="bg-white/80 backdrop-blur-md p-6 pb-4 rounded-b-[32px] shadow-sm z-10 border-b border-gray-100">
                         <div className="flex justify-between items-start mb-1">
                             <div>
                                 <h3 className="text-lg font-bold text-gray-900">Morning Brew</h3>
                                 <p className="text-gray-400 text-xs font-medium">Your Turn is Coming</p>
                             </div>
                             <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                                 Live
                             </span>
                         </div>
                     </div>

                     {/* Main Number Area */}
                     <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 z-10">
                         <div className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-white flex flex-col items-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                             {/* Decorative Top Border */}
                             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                             
                             <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Your Number</span>
                             <div className="text-8xl font-black text-gray-900 mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">42</div>
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                 <Zap size={12} fill="currentColor" />
                                 It's almost your turn
                             </div>
                         </div>

                         {/* Stats */}
                         <div className="grid grid-cols-2 gap-3 w-full">
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center group hover:border-blue-100 transition-colors">
                                 <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">Est. Wait</span>
                                 <span className="text-xl font-bold text-gray-900">2<span className="text-sm font-medium text-gray-400">min</span></span>
                             </div>
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center group hover:border-blue-100 transition-colors">
                                 <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">People Ahead</span>
                                 <span className="text-xl font-bold text-gray-900">1</span>
                             </div>
                         </div>
                     </div>

                     {/* Footer Button */}
                     <div className="p-6 pt-0 z-10">
                          <button className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                              <LogOut size={16} /> Leave Queue
                          </button>
                     </div>
                </div>
              </PhoneMockup>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
