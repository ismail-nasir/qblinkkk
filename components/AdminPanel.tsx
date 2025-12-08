import React, { useState, useEffect } from 'react';
import { User, ActivityLog } from '../types';
import { X, Users, FileText, Search, ShieldAlert, Trash2, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    const allUsers = authService.getAllUsers();
    setUsers(allUsers);
    setLogs(queueService.getSystemLogs(allUsers));
  }, []);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in">
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

                <div className="hidden md:flex text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    System Administrator
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
                            placeholder={activeTab === 'users' ? "Search users by name or email..." : "Search logs..."}
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
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-white shadow-sm">
                                                    {user.businessName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{user.businessName}</p>
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
                                                onClick={() => {
                                                    if(confirm('Are you sure you want to delete this user? This will wipe all their data.')) {
                                                        authService.deleteAccount(user.email).then(() => {
                                                            setUsers(authService.getAllUsers());
                                                        });
                                                    }
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
    </div>
  );
};

export default AdminPanel;