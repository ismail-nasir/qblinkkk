import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6 text-center">
        <div className="mb-8">
            <span className="text-2xl font-bold tracking-tight text-gray-900">Q-Flow</span>
        </div>
        <p className="text-gray-500 mb-8">© 2024 Q-Flow Systems. All rights reserved.</p>
        <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;