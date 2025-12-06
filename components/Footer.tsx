import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 bg-gray-50/50 backdrop-blur-sm border-t border-gray-200">
      <div className="container mx-auto px-6 text-center">
        <div className="mb-8 flex justify-center items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Q-Blink</span>
        </div>
        <p className="text-gray-500">© 2024 Q-Blink Systems. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;