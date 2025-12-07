import React from 'react';
import { AppView } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (view: AppView) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(view);
    window.scrollTo(0,0);
  }

  return (
    <footer id="contact" className="py-12 bg-white border-t border-gray-100 relative z-10">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Qblink</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-semibold text-gray-500">
          <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="hover:text-primary-600 transition-colors">How it Works</a>
          <a href="#features" onClick={scrollToSection('features')} className="hover:text-primary-600 transition-colors">Features</a>
          <a href="#pricing" onClick={scrollToSection('pricing')} className="hover:text-primary-600 transition-colors">Pricing</a>
          <button onClick={handleNavClick(AppView.PRIVACY)} className="hover:text-primary-600 transition-colors">Privacy</button>
          <button onClick={handleNavClick(AppView.TERMS)} className="hover:text-primary-600 transition-colors">Terms</button>
        </div>
        
        <p className="text-sm text-gray-400">© 2024 Qblink. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;