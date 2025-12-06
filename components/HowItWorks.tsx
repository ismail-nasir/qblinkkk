import React from 'react';
import { Scan, Coffee, UserCheck } from 'lucide-react';
import GlassCard from './GlassCard';
import RevealOnScroll from './RevealOnScroll';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 1,
      icon: <Scan size={32} className="text-indigo-600" />,
      title: "Scan to join",
      desc: "Visitors scan a code. No login required. They are instantly in line.",
      color: "bg-indigo-50"
    },
    {
      id: 2,
      icon: <Coffee size={32} className="text-purple-600" />,
      title: "Wait anywhere",
      desc: "They grab a coffee or wait in the car. We update them in real-time.",
      color: "bg-purple-50"
    },
    {
      id: 3,
      icon: <UserCheck size={32} className="text-emerald-500" />,
      title: "Walk in",
      desc: "A text message summons them when you are ready.",
      color: "bg-emerald-50"
    }
  ];

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-20">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto px-2">
              We removed the friction. Your customers enjoy freedom while waiting, and you get an organized flow.
            </p>
          </RevealOnScroll>
        </div>

        {/* Timeline Container */}
        <div className="relative">
           {/* Connecting Line (Desktop) */}
           <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-emerald-100 -translate-y-1/2 z-0 rounded-full"></div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
             {steps.map((step, index) => (
               <RevealOnScroll key={step.id} delay={index * 200} className="relative z-10 flex flex-col items-center">
                 <GlassCard className="p-8 w-full max-w-sm flex flex-col items-center text-center h-full min-h-[280px] md:min-h-[300px] justify-center group" hoverEffect={true}>
                    {/* Icon Squarcle */}
                    <div className={`w-20 h-20 md:w-24 md:h-24 ${step.color} rounded-[28px] flex items-center justify-center mb-6 md:mb-8 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{step.title}</h3>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed">{step.desc}</p>
                 </GlassCard>
                 
                 {/* Step Number Badge */}
                 <div className="absolute -bottom-6 bg-gray-900 text-white w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold border-4 border-white shadow-lg z-20 transition-transform hover:scale-110 text-sm md:text-base">
                   {step.id}
                 </div>
               </RevealOnScroll>
             ))}
           </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;