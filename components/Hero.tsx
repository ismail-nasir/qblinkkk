import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Zap, LogOut } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative pt-24 pb-12 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-blue-100/50 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4"></div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left pt-4 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-50 text-primary-600 text-xs md:text-sm font-semibold mb-6 border border-blue-100"
            >
              <Zap size={14} className="md:w-4 md:h-4" fill="currentColor" /> Smart Queue Management
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-4 md:mb-6 tracking-tight"
            >
              Queue Smarter <br />
              <span className="text-primary-600">With Qblink</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-xl text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Transform waiting into a seamless experience. QR-powered queues, real-time updates, zero friction.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 justify-center lg:justify-start"
            >
              <motion.button 
                onClick={onGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-full bg-primary-600 text-white font-bold text-base md:text-lg shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2"
              >
                Start Free <ArrowRight size={20} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-full bg-white text-gray-900 border border-gray-200 font-semibold text-base md:text-lg hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <Play size={18} fill="currentColor" className="text-gray-900" /> Watch Demo
              </motion.button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 text-sm text-gray-500 font-medium"
            >
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Forever free</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> No credit card</span>
            </motion.div>
          </div>

          {/* Right Visual - Phone Mockup */}
          <div className="lg:w-1/2 w-full flex justify-center lg:justify-end perspective-1000 mt-12 lg:mt-0 px-2 md:px-0 relative">
             {/* Decorative blob behind phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[600px] bg-gradient-to-tr from-primary-100 to-purple-100 rounded-[50px] blur-3xl -z-10 opacity-60 animate-pulse"></div>

            <motion.div 
              initial={{ opacity: 0, rotateY: -10, x: 50 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
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
                                 <p className="text-gray-400 text-xs font-medium">Regular Order</p>
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
                             
                             <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Number</span>
                             <div className="text-7xl font-black text-gray-900 mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">42</div>
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                 <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                 On Time
                             </div>
                         </div>

                         {/* Stats */}
                         <div className="grid grid-cols-2 gap-3 w-full">
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center group hover:border-blue-100 transition-colors">
                                 <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">Wait Time</span>
                                 <span className="text-2xl font-bold text-gray-900">~5<span className="text-sm font-medium text-gray-400">m</span></span>
                             </div>
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center group hover:border-blue-100 transition-colors">
                                 <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">Ahead</span>
                                 <span className="text-2xl font-bold text-gray-900">3</span>
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