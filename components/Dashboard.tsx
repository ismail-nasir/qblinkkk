import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
             </div>
             <span className="font-bold text-xl tracking-tight text-gray-900">Qblink</span>
          </div>

          {/* Profile Section */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-200 focus:outline-none"
            >
                <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-cyan-100 text-primary-600 flex items-center justify-center font-bold rounded-full border-2 border-white shadow-sm">
                    {user.businessName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[150px] truncate">
                    {user.businessName}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-soft border border-gray-100 py-2 animate-fade-in-up origin-top-right z-50">
                  <div className="px-5 py-3 border-b border-gray-50 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.businessName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <button className="w-full text-left px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center gap-3 transition-colors">
                      <Settings size={18} /> Settings
                  </button>
                  
                  <div className="h-px bg-gray-50 my-1"></div>
                  
                  <button 
                      onClick={onLogout}
                      className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                      <LogOut size={18} /> Logout
                  </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area - Blank with Welcome Message */}
      <main className="container mx-auto px-4 md:px-6 pt-12 md:pt-24">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Welcome, <span className="text-primary-600">@{user.businessName}</span>
        </h1>
      </main>
    </div>
  );
};

export default Dashboard;