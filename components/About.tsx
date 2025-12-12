import React, { useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

const motion = m as any;

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
          {/* Header */}
          <div className="mb-8 md:mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-3 tracking-tight">
              About Qblink
            </h1>
            <p className="text-sm md:text-base text-gray-500 max-w-xl md:mt-1 mx-auto md:mx-0">
              A lightweight, no-app queue system built to make waiting invisible
              for customers and simple for businesses.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Main Mission Card */}
            <GlassCard className="p-6 md:p-8 text-center bg-white/60">
              <p className="text-base md:text-xl font-medium text-gray-800 leading-relaxed">
                Qblink was created with one goal: remove the stress, confusion,
                and wasted time caused by traditional waiting lines. Queues
                should be simple, digital, and accessible to everyone — without
                forcing people to download an app or create an account.
              </p>
            </GlassCard>

            {/* Split Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <GlassCard className="p-6 md:p-8 h-full bg-blue-50/50 border-blue-100 hover:bg-blue-50/80 transition-colors">
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                  Qblink helps any service-based business run smoother — from
                  barbershops and clinics to banks and student services.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li>• Clear, fair queues without crowding</li>
                  <li>• Live status updates for every visitor</li>
                  <li>• Simple setup that works on any device</li>
                </ul>
              </GlassCard>

              <GlassCard className="p-6 md:p-8 h-full bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/80 transition-colors">
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                  Qblink is completely free to start using. Our vision is to
                  keep queue management accessible for small teams as well as
                  growing businesses.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li>• No subscriptions or hidden charges</li>
                  <li>• Designed for low-network environments</li>
                  <li>• Ready in minutes — not weeks</li>
                </ul>
              </GlassCard>
            </div>

            {/* Improvement Card */}
            <GlassCard className="p-6 md:p-8 text-center bg-gray-50/50">
              <p className="text-sm md:text-base text-gray-600">
                Qblink is evolving with every release — improving reliability,
                real-time updates, and owner tools based on feedback from
                real-world queues.
              </p>
            </GlassCard>

            {/* Contact Us */}
            <GlassCard className="p-6 md:p-8 bg-white/70">
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-3">
                Contact us
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-3">
                Have questions, feedback, or want to try Qblink in your
                business? Reach out anytime.
              </p>
              <div className="space-y-1 text-sm md:text-base text-gray-700">
                <p>
                  <a
                    href="mailto:hello@qblink.app"
                    className="text-primary-600 font-semibold hover:underline"
                  >
                    hello@qblink.app
                  </a>

                </p>
                <p>Location: Remote-first, supporting businesses worldwide</p>
              </div>
            </GlassCard>

            {/* Closing Statement */}
            <div className="bg-gradient-to-r from-blue-100/50 to-cyan-100/50 rounded-[32px] p-8 md:p-10 text-center border border-white/50 shadow-glass">
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight mb-2">
                Qblink is not just a token system.
              </h3>
              <p className="text-sm md:text-base text-gray-700">
                It is the simplest way to bring order, professionalism, and calm
                to busy waiting rooms — for both your staff and your customers.
              </p>
            </div>

            {/* Bottom Back button */}
            {onBack && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-600 font-semibold shadow-sm border border-gray-200 hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} /> Back to Home
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;