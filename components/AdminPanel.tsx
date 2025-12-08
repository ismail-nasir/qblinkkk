import React, { useState, useEffect } from 'react';
import { User, ActivityLog, QueueData } from '../types';
import { X, Users, FileText, Search, ShieldAlert, Trash2, ArrowLeft, Clock, Activity, Eye, Calendar, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/auth';
import { queueService } from '../services/queue';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<(ActivityLog & { user: string, email: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real-time metrics
  const [activeVisitors, setActiveVisitors] = useState(124);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userQueueData, setUserQueueData] = useState<QueueData | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // Simulate real-time visitor fluctuations
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveVisitors(prev => {
              const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
              return Math.max(50, prev + change);
          });
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
      const allUsers = authService.getAllUsers();
      setUsers(allUsers);
      setLogs(queueService.getSystemLogs(allUsers));
  };

  const handleUserClick = (user: User) => {
      const data = queueService.getQueueData(user.id);
      setUserQueueData(data);
      setSelectedUser(user);
  };

  const confirmDeleteUser = async () => {
      if (userToDelete) {
          await authService.deleteAccount(userToDelete.email);
          refreshData();
          setUserToDelete(null);
          setSelectedUser(null); // Close details if open
      }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in relative">
        {/* Header - Full Width */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
            <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                     {/* Back Button */}
                    <button 
                        onClick={onClose} 
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gray-800 to-black text-white rounded-xl shadow-lg shadow-gray-900/10">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Admin Console</h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                         <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-xs font-bold text-green-700">{activeVisitors} Live Visitors</span>
                     </div>
                    <div className="hidden md:flex text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        System Administrator
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-6 py-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                 {/* Tabs & Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 border-b border-gray-100">
                    <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users size={18} /> Users ({users.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileText size={18} /> System Logs ({logs.length})
                        </button>
                    </div>
                    
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'users' ? "Search users..." : "Search logs..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-all"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-x-auto">
                    {activeTab === 'users' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="p-6 font-semibold">User Info</th>
                                    <th className="p-6 font-semibold">Joined</th>
                                    <th className="p-6 font-semibold">Status</th>
                                    <th className="p-6 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(user => (
                                    <tr 
                                        key={user.id} 
                                        onClick={() => handleUserClick(user)}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-white shadow-sm">
                                                    {user.businessName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">{user.businessName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm font-medium text-gray-600">
                                                {new Date(user.joinedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUserToDelete(user);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Users size={48} className="mb-4 opacity-20" />
                                                <p className="text-lg font-medium text-gray-900">No users found</p>
                                                <p className="text-sm">Try adjusting your search terms</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="p-6 font-semibold">Time</th>
                                    <th className="p-6 font-semibold">User</th>
                                    <th className="p-6 font-semibold">Action</th>
                                    <th className="p-6 font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6 text-sm text-gray-600 font-mono">
                                            {log.time}
                                        </td>
                                        <td className="p-6">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{log.user}</p>
                                                <p className="text-xs text-gray-400">{log.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border
                                                ${log.action === 'call' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                                                ${log.action === 'complete' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                                ${log.action === 'skip' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                                            `}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm text-gray-600 font-medium">
                                            Ticket #{log.ticket}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                             <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FileText size={48} className="mb-4 opacity-20" />
                                                <p className="text-lg font-medium text-gray-900">No logs found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>

        {/* User Details Modal */}
        <AnimatePresence>
            {selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50 max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/30">
                                    {selectedUser.businessName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.businessName}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                        <Calendar size={14} /> Joined
                                    </div>
                                    <div className="font-semibold text-gray-900 text-sm">
                                        {new Date(selectedUser.joinedAt).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(selectedUser.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-1 text-green-600 font-bold text-xs uppercase tracking-wider">
                                        <CheckCircle size={14} /> Served
                                    </div>
                                    <div className="font-bold text-2xl text-gray-900">
                                        {userQueueData?.metrics.served || 0}
                                    </div>
                                    <div className="text-xs text-gray-400">Total Customers</div>
                                </div>
                                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                    <div className="flex items-center gap-2 mb-1 text-orange-600 font-bold text-xs uppercase tracking-wider">
                                        <Clock size={14} /> Avg Wait
                                    </div>
                                    <div className="font-bold text-2xl text-gray-900">
                                        {userQueueData?.metrics.avgWaitTime || 0}<span className="text-sm font-medium text-gray-500">m</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Per Customer</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Activity size={16} className="text-primary-600" /> Recent Activity
                                </h4>
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden max-h-[300px] overflow-y-auto">
                                    {userQueueData?.recentActivity && userQueueData.recentActivity.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {userQueueData.recentActivity.slice(0, 50).map((log, i) => (
                                                <div key={i} className="p-3 flex items-center justify-between text-sm hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">{log.time}</span>
                                                        <span className={`font-medium ${
                                                            log.action === 'call' ? 'text-blue-600' :
                                                            log.action === 'complete' ? 'text-green-600' : 'text-gray-600'
                                                        }`}>
                                                            {log.action === 'call' ? 'Called Customer' : 
                                                             log.action === 'complete' ? 'Completed Service' : 'Skipped'}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">#{log.ticket}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-gray-400 text-sm">No activity recorded yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setUserToDelete(selectedUser);
                                    // Don't close details yet, let confirmation overlay it
                                }}
                                className="px-4 py-2 bg-white text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete User
                            </button>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
            {userToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
                    >
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete <strong className="text-gray-900">{userToDelete.businessName}</strong>? <br/>
                            This action will permanently erase all their data and cannot be undone.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmDeleteUser}
                                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all"
                            >
                                Yes, Delete Account
                            </button>
                            <button 
                                onClick={() => setUserToDelete(null)}
                                className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default AdminPanel;