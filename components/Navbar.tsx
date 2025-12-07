import React from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onGetStarted?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStarted }) => {
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 md:px-6 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto pointer-events-auto bg-white/50 backdrop-blur-xl rounded-full px-6 py-4 shadow-glass border border-white/40 flex items-center justify-between transition-all hover:bg-white/60">
        
        {/* Logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-600/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Qblink</span>
        </a>

        {/* Links - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="hover:text-primary-600 transition-colors">How it Works</a>
          <a href="#features" onClick={scrollToSection('features')} className="hover:text-primary-600 transition-colors">Features</a>
          <a href="#contact" onClick={scrollToSection('contact')} className="hover:text-primary-600 transition-colors">Contact</a>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onGetStarted}
            className="hidden sm:block text-sm font-semibold text-gray-900 hover:text-primary-600 px-4 py-2 bg-white/50 rounded-full border border-white/60 hover:bg-white transition-all shadow-sm"
          >
            Sign In
          </button>
          <motion.button 
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-semibold text-white bg-primary-600 px-6 py-2.5 rounded-full shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;