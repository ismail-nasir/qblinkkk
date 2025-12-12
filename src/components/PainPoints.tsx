
import React from 'react';
import RevealOnScroll from './RevealOnScroll';
import GlassCard from './GlassCard';
import { Timer, Armchair, AlertCircle } from 'lucide-react';

const PainPoints: React.FC = () => {
  return (
    <section className="py-12 md:py-24 relative z-10 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <RevealOnScroll>
          <div className="text-center mb-8 md:mb-16">
            <span className="text-indigo-600 font-bold tracking-wider uppercase text-xs md:text-sm mb-2 block">The Problem</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Traditional queuing is broken.
            </h2>
            <p className="text-sm md:text-xl text-gray-600 max-w-2xl mx-auto">
              We eliminated the invisible friction that frustrates your customers.
            </p>
          </div>
        </RevealOnScroll>

        {/* Mobile: Horizontal Scroll / Desktop: Grid */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-8 pb-6 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
           {/* Card 1 */}
           <div className="min-w-[85vw] md:min-w-0 snap-center">
             <RevealOnScroll delay={100}>
               <GlassCard className="p-6 md:p-8 h-full border-red-100/30 bg-gradient-to-b from-white/80 to-red-50/30" hoverEffect>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-red-500">
                     <Timer size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Dead Time</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Customers standing in line aren't shopping, relaxing, or enjoying their day. They are just... waiting.
                  </p>
               </GlassCard>
             </RevealOnScroll>
           </div>

           {/* Card 2 */}
           <div className="min-w-[85vw] md:min-w-0 snap-center">
             <RevealOnScroll delay={200}>
               <GlassCard className="p-6 md:p-8 h-full border-orange-100/30 bg-gradient-to-b from-white/80 to-orange-50/30" hoverEffect>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-orange-500">
                     <AlertCircle size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Anxiety</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    The fear of missing a name call keeps people tethered to the waiting area, stressed and unhappy.
                  </p>
               </GlassCard>
             </RevealOnScroll>
           </div>

           {/* Card 3 */}
           <div className="min-w-[85vw] md:min-w-0 snap-center">
             <RevealOnScroll delay={300}>
               <GlassCard className="p-6 md:p-8 h-full border-gray-100/30 bg-gradient-to-b from-white/80 to-gray-50/30" hoverEffect>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-gray-500">
                     <Armchair size={24} className="md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Congestion</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Crowded waiting rooms feel chaotic and unsafe. Give your physical space some breathing room.
                  </p>
               </GlassCard>
             </RevealOnScroll>
           </div>
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
