import React from 'react';
import RevealOnScroll from './RevealOnScroll';
import GlassCard from './GlassCard';
import { Timer, Armchair, AlertCircle } from 'lucide-react';

const PainPoints: React.FC = () => {
  return (
    <section className="py-24 relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-2 block">The Problem</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Traditional queuing is broken.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              We eliminated the invisible friction that frustrates your customers before they even reach the counter.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Card 1 */}
           <RevealOnScroll delay={100}>
             <GlassCard className="p-8 h-full border-red-100/30 bg-gradient-to-b from-white/80 to-red-50/30" hoverEffect>
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                   <Timer size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Dead Time</h3>
                <p className="text-gray-600">
                  Customers standing in line aren't shopping, relaxing, or enjoying their day. They are just... waiting.
                </p>
             </GlassCard>
           </RevealOnScroll>

           {/* Card 2 */}
           <RevealOnScroll delay={200}>
             <GlassCard className="p-8 h-full border-orange-100/30 bg-gradient-to-b from-white/80 to-orange-50/30" hoverEffect>
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                   <AlertCircle size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">The "Did I miss it?" Anxiety</h3>
                <p className="text-gray-600">
                  The fear of missing a name call keeps people tethered to the waiting area, stressed and unhappy.
                </p>
             </GlassCard>
           </RevealOnScroll>

           {/* Card 3 */}
           <RevealOnScroll delay={300}>
             <GlassCard className="p-8 h-full border-gray-100/30 bg-gradient-to-b from-white/80 to-gray-50/30" hoverEffect>
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-gray-500">
                   <Armchair size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Lobby Congestion</h3>
                <p className="text-gray-600">
                  Crowded waiting rooms feel chaotic and unsafe. Give your physical space some breathing room.
                </p>
             </GlassCard>
           </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;