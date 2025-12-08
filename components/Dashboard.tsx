import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, Trash2, X } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/auth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteAccount = async () => {
      if (confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be lost immediately.")) {
          setIsDeleting(true);
          try {
              await authService.deleteAccount(user.email);
              onLogout(); // Redirects to landing page
          } catch (e) {
              alert("Failed to delete account. Please try again.");
              setIsDeleting(false);
          }
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
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
                  
                  <button 
                      onClick={() => {
                          setIsDropdownOpen(false);
                          setIsSettingsOpen(true);
                      }}
                      className="w-full text-left px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 flex items-center gap-3 transition-colors"
                  >
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
      <main className="container mx-auto px-4 md:px-6 pt-12 md:pt-24 relative z-0">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Welcome, <span className="text-primary-600">@{user.businessName}</span>
        </h1>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in border border-white/50">
                  <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-xl">
                              <Settings size={20} className="text-gray-600" />
                          </div>
                          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                      </div>
                      <button 
                          onClick={() => setIsSettingsOpen(false)} 
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      {/* Read-only User Info */}
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business Name</label>
                              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-medium">
                                  {user.businessName}
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-medium">
                                  {user.email}
                              </div>
                          </div>
                      </div>

                      <div className="h-px bg-gray-100 w-full"></div>

                      {/* Danger Zone */}
                      <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100">
                          <h3 className="text-sm font-bold text-red-700 mb-1 flex items-center gap-2">
                              <Trash2 size={16} /> Danger Zone
                          </h3>
                          <p className="text-xs text-red-600/80 mb-4 leading-relaxed">
                              Permanently remove your account and all associated data. This action cannot be undone.
                          </p>
                          <button 
                              onClick={handleDeleteAccount}
                              disabled={isDeleting}
                              className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 rounded-xl font-bold text-sm transition-all shadow-sm border border-red-100 hover:border-red-200 flex items-center justify-center gap-2"
                          >
                              {isDeleting ? (
                                  <>Processing...</>
                              ) : (
                                  <>Delete Account</>
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;