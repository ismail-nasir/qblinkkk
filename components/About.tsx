import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

interface AboutProps {
  onBack?: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pb-20 pt-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto pt-20">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
              About Qblink
            </h1>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Main Mission Card */}
            <GlassCard className="p-8 md:p-12 text-center bg-white/60">
              <p className="text-lg md:text-2xl font-medium text-gray-800 leading-relaxed">
                Qblink was created with one goal: remove the stress, confusion, and wasted time caused by traditional waiting lines. We believe queues should be simple, digital, and accessible to everyone — without forcing people to download an app or create an account.
              </p>
            </GlassCard>

            {/* Split Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <GlassCard className="p-8 h-full bg-blue-50/50 border-blue-100 hover:bg-blue-50/80 transition-colors">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Our system is built to help businesses of any size operate smoothly. From small barbershops to busy clinics, Qblink provides the tools to manage customer flow, reduce crowding, and deliver a better experience.
                </p>
              </GlassCard>

              <GlassCard className="p-8 h-full bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/80 transition-colors">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Qblink is completely free because we use a clean ad-supported model. No subscriptions. No hidden charges. Just reliable queue management that works instantly.
                </p>
              </GlassCard>
            </div>

            {/* Improvement Card */}
            <GlassCard className="p-8 text-center bg-gray-50/50">
              <p className="text-base md:text-lg text-gray-600">
                We are constantly improving the platform, fixing errors, enhancing live updates, and expanding features based on feedback from real businesses.
              </p>
            </GlassCard>

            {/* Closing Statement */}
            <div className="bg-gradient-to-r from-blue-100/50 to-cyan-100/50 rounded-[32px] p-8 md:p-12 text-center border border-white/50 shadow-glass">
              <h3 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
                Qblink is not just a tool — it's the simplest way to bring order, professionalism, and efficiency to your service.
              </h3>
            </div>
            
            <div className="flex justify-center mt-8">
                 {onBack && (
                  <button 
                      onClick={onBack}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-600 font-bold shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors hover:scale-105 active:scale-95 transform"
                  >
                      <ArrowLeft size={18} /> Back to Home
                  </button>
                )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;