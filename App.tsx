import React from 'react';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import RevealOnScroll from './components/RevealOnScroll';
import { ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden text-gray-900">
      
      {/* Global Background Gradient Mesh */}
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-3xl mix-blend-multiply filter animate-blob"></div>
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply filter animate-blob animation-delay-4000"></div>
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
      </div>

      {/* Simplified Navbar - Logo Only */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">Q-Flow</span>
          </div>
          {/* Nav links and Login button removed as requested */}
        </div>
      </nav>

      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        
        {/* Simple CTA Section */}
        <section className="py-20 md:py-32 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 md:px-6 text-center">
              <RevealOnScroll>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                  Start managing your queue today.
                </h2>
                <div className="flex justify-center mt-8 md:mt-12">
                  <button 
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all hover:gap-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden"
                  >
                     {/* Shimmer overlay */}
                     <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                    <span className="relative z-10 flex items-center gap-2">Create my Queue <ArrowRight size={20} /></span>
                  </button>
                </div>
              </RevealOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;