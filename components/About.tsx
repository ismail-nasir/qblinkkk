import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import RevealOnScroll from './RevealOnScroll';

const About: React.FC = () => {
  return (
    <section id="about" className="py-16 md:py-24 relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
              About Qlink
            </h2>
          </div>
        </RevealOnScroll>

        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          {/* Main Mission Card */}
          <RevealOnScroll delay={100}>
            <GlassCard className="p-8 md:p-12 text-center bg-white/60">
              <p className="text-lg md:text-2xl font-medium text-gray-800 leading-relaxed">
                Qlink was created with one goal: remove the stress, confusion, and wasted time caused by traditional waiting lines. We believe queues should be simple, digital, and accessible to everyone — without forcing people to download an app or create an account.
              </p>
            </GlassCard>
          </RevealOnScroll>

          {/* Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <RevealOnScroll delay={200}>
              <GlassCard className="p-8 h-full bg-blue-50/50 border-blue-100 hover:bg-blue-50/80 transition-colors">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Our system is built to help businesses of any size operate smoothly. From small barbershops to busy clinics, Qlink provides the tools to manage customer flow, reduce crowding, and deliver a better experience.
                </p>
              </GlassCard>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <GlassCard className="p-8 h-full bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/80 transition-colors">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Qlink is completely free because we use a clean ad-supported model. No subscriptions. No hidden charges. Just reliable queue management that works instantly.
                </p>
              </GlassCard>
            </RevealOnScroll>
          </div>

          {/* Improvement Card */}
          <RevealOnScroll delay={400}>
            <GlassCard className="p-8 text-center bg-gray-50/50">
              <p className="text-base md:text-lg text-gray-600">
                We are constantly improving the platform, fixing errors, enhancing live updates, and expanding features based on feedback from real businesses.
              </p>
            </GlassCard>
          </RevealOnScroll>

          {/* Closing Statement */}
          <RevealOnScroll delay={500}>
            <div className="bg-gradient-to-r from-blue-100/50 to-cyan-100/50 rounded-[32px] p-8 md:p-12 text-center border border-white/50 shadow-glass">
              <h3 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
                Qlink is not just a tool — it's the simplest way to bring order, professionalism, and efficiency to your service.
              </h3>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

export default About;