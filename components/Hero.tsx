import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Clock, Users, Zap } from 'lucide-react';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4"></div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-primary-600 text-sm font-semibold mb-6 border border-blue-100"
            >
              <Zap size={16} fill="currentColor" /> Smart Queue Management
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight"
            >
              Queue Smarter <br />
              <span className="text-primary-600">With Qblink</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Transform waiting into a seamless experience. QR-powered queues, real-time updates, zero friction.
            </motion.p>

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
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-primary-600 text-white font-bold text-lg shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2"
              >
                Start Free <ArrowRight size={20} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-gray-900 border border-gray-200 font-semibold text-lg hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <Play size={18} fill="currentColor" className="text-gray-900" /> Watch Demo
              </motion.button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500 font-medium"
            >
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Forever free</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> No credit card</span>
            </motion.div>
          </div>

          {/* Right Visual - The "Coffee House" Card */}
          <div className="lg:w-1/2 w-full flex justify-center perspective-1000">
            <motion.div 
              initial={{ opacity: 0, rotateY: -10, x: 50 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-6 md:p-8 border border-white/50"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
                    <Zap size={28} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Coffee House</h3>
                    <p className="text-gray-500 text-sm">Main Queue</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">Active</span>
              </div>

              {/* Blue Status Card */}
              <div className="bg-gradient-to-br from-primary-500 to-cyan-500 rounded-3xl p-8 text-center text-white shadow-lg shadow-primary-500/25 mb-8 transform transition-transform hover:scale-[1.02]">
                <p className="text-primary-100 font-medium mb-2">Your Position</p>
                <div className="text-7xl font-extrabold mb-2 tracking-tighter">#3</div>
                <p className="text-primary-100">in line</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <Clock size={24} className="mx-auto text-primary-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Wait Time</p>
                  <p className="text-xl font-bold text-gray-900">~8 min</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <Users size={24} className="mx-auto text-primary-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ahead</p>
                  <p className="text-xl font-bold text-gray-900">2 people</p>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;