import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, Trash2, X, ShieldAlert, Cloud, Download, Upload, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, QueueInfo } from '../types';
import { authService } from '../services/auth';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import AdminPanel from './AdminPanel';
import QueueManager from './QueueManager';
import QueueList from './QueueList';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Navigation State
  const [selectedQueue, setSelectedQueue] = useState<QueueInfo | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for admin privileges
  const isAdmin = authService.isAdmin(user.email || '');

  // Initialize Socket Connection
  useEffect(() => {
    socketService.connect();
    return () => {
        socketService.disconnect();
    };
  }, []);

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

  const handleExportData = () => {
      queueService.exportUserData(user.id);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          if(confirm("This will overwrite your current dashboard data with the backup file. Continue?")) {
              setIsImporting(true);
              const success = await queueService.importUserData(user.id, e.target.files[0]);
              if (success) {
                  alert("Data restored successfully! The page will now refresh.");
                  window.location.reload();
              } else {
                  alert("Failed to import data. Please check the file format.");
                  setIsImporting(false);
              }
          }
          // Reset input
          e.target.value = '';
      }
  };

  // If Admin Panel is open, render it as the full view
  if (isAdminOpen) {
      return <AdminPanel onClose={() => setIsAdminOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedQueue(null)}>
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
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 sm:pr-3 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-200 focus:outline-none"
            >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-100 to-cyan-100 text-primary-600 flex items-center justify-center font-bold rounded-full border-2 border-white shadow-sm text-sm sm:text-base shrink-0">
                    {user.businessName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[150px] truncate">
                    {user.businessName}
                </span>
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                   <ChevronDown size={16} className="text-gray-400" />
                </motion.div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-soft border border-gray-100 py-2 origin-top-right z-50 overflow-hidden"
                >
                    <div className="px-5 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.businessName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {isAdmin && (
                            <span className="inline-block mt-1 text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                        )}
                    </div>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => {
                                setIsDropdownOpen(false);
                                setIsAdminOpen(true);
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-black flex items-center gap-3 transition-colors font-medium"
                        >
                            <ShieldAlert size={18} /> Admin Panel
                        </button>
                    )}

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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto pt-6 md:pt-10 relative z-0">
          <AnimatePresence mode="wait">
              {selectedQueue ? (
                  <motion.div
                    key="manager"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                      <QueueManager 
                        queue={selectedQueue} 
                        user={user}
                        onBack={() => setSelectedQueue(null)} 
                      />
                  </motion.div>
              ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                      <QueueList user={user} onSelectQueue={setSelectedQueue} />
                  </motion.div>
              )}
          </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50"
                >
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
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-medium truncate">
                                    {user.businessName}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-medium truncate">
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 w-full"></div>

                        {/* Data Sync Section (Cloud Simulation) */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                             <h3 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                                <Cloud size={16} /> Data Sync (Manual)
                            </h3>
                            <p className="text-xs text-blue-600/80 mb-4 leading-relaxed">
                                Qblink stores data locally on your device for privacy. To move your queues to another device, export a backup and restore it there.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleExportData}
                                    className="flex flex-col items-center justify-center p-3 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    <Download size={20} className="text-blue-600 mb-1" />
                                    <span className="text-xs font-bold text-gray-700">Backup Data</span>
                                </button>
                                
                                <button 
                                    onClick={handleImportClick}
                                    className="flex flex-col items-center justify-center p-3 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors shadow-sm relative"
                                >
                                    {isImporting ? <RefreshCw size={20} className="text-blue-600 mb-1 animate-spin" /> : <Upload size={20} className="text-blue-600 mb-1" />}
                                    <span className="text-xs font-bold text-gray-700">Restore Data</span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept=".json"
                                        onChange={handleImportFile}
                                    />
                                </button>
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
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;