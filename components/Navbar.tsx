import React from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onGetStarted?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStarted }) => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute top-0 left-0 right-0 z-50 pt-6 px-4 md:px-6"
    >
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-full px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onGetStarted}>
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Qblink</span>
        </div>

        {/* Links - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <a href="#" className="hover:text-primary-600 transition-colors">About</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Team</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onGetStarted}
            className="hidden sm:block text-sm font-semibold text-gray-900 hover:text-primary-600 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 hover:bg-white transition-all"
          >
            Sign In
          </button>
          <motion.button 
            onClick={onGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-semibold text-white bg-primary-600 px-6 py-2.5 rounded-full shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;