import React from 'react';
import GlassCard from './GlassCard';
import RevealOnScroll from './RevealOnScroll';

// Helper component for the animated mini-phone
const MiniPhoneMockup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-[120px] h-[220px] bg-gray-900 rounded-[20px] p-2 shadow-2xl relative border-4 border-gray-800 flex flex-col justify-start overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-lg z-20"></div>
    <div className="bg-white w-full h-full rounded-[14px] overflow-hidden relative">
      {children}
    </div>
  </div>
);

const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: "Scan to join",
      desc: "Visitors scan a code. No login required. They are instantly in line.",
      visual: (
        <MiniPhoneMockup>
          {/* Scan UI Animation */}
          <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
            {/* Camera Feed Background */}
            <div className="absolute inset-0 bg-gray-800 flex flex-wrap content-center justify-center gap-1 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-white opacity-20"></div>
              ))}
            </div>
            {/* Viewfinder Frame */}
            <div className="w-20 h-20 border-2 border-white/50 rounded-lg relative z-10 flex items-center justify-center">
               <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white"></div>
               <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white"></div>
               <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white"></div>
               <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white"></div>
               
               {/* Scanning Laser */}
               <div className="w-full h-[2px] bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] absolute top-[10%] animate-scan"></div>
               
               {/* QR Code Graphic */}
               <div className="w-12 h-12 bg-white p-1 grid grid-cols-4 gap-[2px]">
                 {[...Array(16)].map((_, i) => (
                   <div key={i} className={`bg-black ${[0,2,5,8,10,15].includes(i) ? 'opacity-0' : 'opacity-100'} rounded-[1px]`}></div>
                 ))}
               </div>
            </div>
          </div>
        </MiniPhoneMockup>
      )
    },
    {
      id: 2,
      title: "Wait anywhere",
      desc: "They grab a coffee or wait in the car. We update them in real-time.",
      visual: (
        <MiniPhoneMockup>
           <div className="w-full h-full bg-gray-50 flex flex-col items-center pt-8 relative">
              {/* App Header */}
              <div className="w-full h-10 bg-white shadow-sm absolute top-0 left-0"></div>
              
              {/* Coffee Animation */}
              <div className="mt-6 relative">
                 <div className="w-12 h-8 bg-purple-200 rounded-b-xl relative z-10 border border-purple-300"></div>
                 <div className="absolute top-1 -right-2 w-3 h-4 border-2 border-purple-300 rounded-r-lg"></div>
                 {/* Steam */}
                 <div className="absolute -top-4 left-2 w-1.5 h-3 bg-gray-300 rounded-full animate-float"></div>
                 <div className="absolute -top-3 left-5 w-1.5 h-3 bg-gray-300 rounded-full animate-float animation-delay-200"></div>
                 <div className="absolute -top-5 left-8 w-1.5 h-3 bg-gray-300 rounded-full animate-float animation-delay-500"></div>
              </div>

              {/* Status Text */}
              <div className="mt-4 flex flex-col gap-2 w-full px-4">
                <div className="h-2 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 w-1/2 bg-gray-200 rounded animate-pulse animation-delay-100"></div>
              </div>
              
              {/* Notification Popup */}
              <div className="absolute bottom-4 left-2 right-2 bg-white p-2 rounded-lg shadow-lg border border-gray-100 flex gap-2 items-center animate-pop-in animation-delay-2000">
                 <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs">🔔</div>
                 <div className="h-1.5 w-16 bg-gray-300 rounded"></div>
              </div>
           </div>
        </MiniPhoneMockup>
      )
    },
    {
      id: 3,
      title: "Walk in",
      desc: "A text message summons them when you are ready.",
      visual: (
        <MiniPhoneMockup>
           <div className="w-full h-full bg-emerald-500 flex flex-col items-center justify-center relative overflow-hidden">
               {/* Success Rings */}
               <div className="absolute w-40 h-40 border-4 border-white/20 rounded-full animate-ping"></div>
               <div className="absolute w-32 h-32 border-4 border-white/30 rounded-full animate-pulse"></div>
               
               {/* Checkmark */}
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg z-10 animate-pop-in">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               
               <div className="mt-4 text-white text-xs font-bold tracking-wider uppercase animate-fade-in-up animation-delay-300">Your Turn</div>
           </div>
        </MiniPhoneMockup>
      )
    }
  ];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-20 relative z-10">
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
                 <GlassCard className="p-8 w-full max-w-sm flex flex-col items-center text-center h-full min-h-[380px] justify-start group" hoverEffect={true}>
                    
                    {/* Animated Visual Area */}
                    <div className="mb-8 transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                      {step.visual}
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">{step.title}</h3>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed">{step.desc}</p>
                 </GlassCard>
                 
                 {/* Step Number Badge */}
                 <div className="absolute -bottom-4 bg-gray-900 text-white w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold border-4 border-white shadow-lg z-20 transition-transform hover:scale-110 text-sm md:text-base">
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