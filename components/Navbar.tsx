import React, { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { AppView } from '../types';

const motion = m as any;

interface NavbarProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  onNavigate?: (view: AppView) => void;
  currentView?: AppView;
}

const Navbar: React.FC<NavbarProps> = ({
  onGetStarted,
  onSignIn,
  onNavigate,
  currentView,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);

    // If not on landing page, go there first
    if (currentView !== AppView.LANDING && onNavigate) {
      onNavigate(AppView.LANDING);
      // Wait a tick for render then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentView !== AppView.LANDING && onNavigate) {
      onNavigate(AppView.LANDING);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 pt-4 md:pt-6 px-4 md:px-6 pointer-events-none"
    >
      <div
        className={`max-w-7xl mx-auto pointer-events-auto bg-white/70 backdrop-blur-xl md:rounded-full px-6 py-4 shadow-glass border border-white/40 flex flex-col md:flex-row items-center md:justify-between transition-all duration-300 hover:bg-white/80 ${
          isOpen ? 'rounded-[32px]' : 'rounded-full'
        }`}
      >
        <div className="w-full md:w-auto flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-600/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Qblink
            </span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-primary-600 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <a
            href="#how-it-works"
            onClick={handleLinkClick('how-it-works')}
            className="hover:text-primary-600 transition-colors"
          >
            How it Works
          </a>
          <a
            href="#features"
            onClick={handleLinkClick('features')}
            className="hover:text-primary-600 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={handleLinkClick('pricing')}
            className="hover:text-primary-600 transition-colors"
          >
            Pricing
          </a>
          {/* About now opens the About page instead of Contact */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onNavigate && onNavigate(AppView.ABOUT);
            }}
            className="hover:text-primary-600 transition-colors"
          >
            About
          </button>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onSignIn}
            className="text-sm font-semibold text-gray-900 hover:text-primary-600 px-4 py-2 bg-white/50 rounded-full border border-white/60 hover:bg-white transition-all shadow-sm"
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

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full md:hidden overflow-hidden"
            >
              <div className="flex flex-col items-center gap-2 py-6 text-center font-medium text-gray-600 border-t border-gray-100/50 mt-4">
                {['how-it-works', 'features', 'pricing'].map((section) => (
                  <a
                    key={section}
                    href={`#${section}`}
                    onClick={handleLinkClick(section)}
                    className="w-full py-3 hover:text-primary-600 hover:bg-gray-50/50 rounded-xl transition-colors text-lg"
                  >
                    {section
                      .split('-')
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(' ')}
                  </a>
                ))}

                {/* Mobile About item – opens About page */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    onNavigate && onNavigate(AppView.ABOUT);
                  }}
                  className="w-full py-3 hover:text-primary-600 hover:bg-gray-50/50 rounded-xl transition-colors text-lg"
                >
                  About
                </button>

                <div className="flex flex-col gap-3 mt-4 w-full px-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onSignIn) onSignIn();
                    }}
                    className="w-full py-3.5 rounded-xl bg-gray-50 text-gray-900 font-semibold border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onGetStarted) onGetStarted();
                    }}
                    className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;