import React from 'react';
import PhoneMockup from './PhoneMockup';
import { ArrowRight, QrCode, Clock, CheckCircle } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <section className="relative w-full overflow-hidden pt-32 pb-32">
      <div className="container mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center">
        
        {/* Text Content */}
        <div className="lg:w-1/2 text-center lg:text-left z-10 mb-20 lg:mb-0">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]">
            Queueing, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              reimagined for humans.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            No apps to install. No hardware to buy. Just a smooth, transparent flow that respects your customers' time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={onStart}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-full transition-all hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              Start for Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white/50 backdrop-blur-sm text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-indigo-200 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Isometric 3D Visuals */}
        <div className="lg:w-1/2 flex justify-center items-center perspective-1000">
          <div className="relative w-full max-w-[600px] h-[600px] flex items-center justify-center">
            
            {/* Phone 1: Scan Screen */}
            <div className="absolute left-4 lg:left-0 z-10 animate-float">
              <PhoneMockup variant="left">
                <div className="flex flex-col h-full items-center justify-center bg-gray-50 p-6">
                  <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                    <QrCode size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Join the Queue</h3>
                  <p className="text-sm text-gray-500 text-center mb-8">Scan the code at the counter to secure your spot instantly.</p>
                  <div className="w-full h-12 bg-indigo-600 rounded-xl text-white flex items-center justify-center font-medium shadow-lg shadow-indigo-500/30">
                    Scan Now
                  </div>
                </div>
              </PhoneMockup>
            </div>

            {/* Phone 2: Notification Screen */}
            <div className="absolute right-4 lg:right-0 z-20 mt-24 lg:mt-32 animate-float animation-delay-3000">
              <PhoneMockup variant="right">
                <div className="flex flex-col h-full bg-white relative">
                  <div className="bg-emerald-500 h-1/2 w-full flex flex-col items-center justify-center text-white p-6 rounded-b-[40px] shadow-lg">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold">It's your turn!</h2>
                    <p className="opacity-90 mt-2">Please head to Counter 3</p>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 mb-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <Clock size={20} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Wait</p>
                        <p className="font-semibold text-gray-900">12 mins</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;