import React, { useState, useEffect } from 'react';
import { User, ActivityLog } from '../types';
import { X, Users, FileText, Search, ShieldAlert, Trash2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fade-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-white/50 animate-pop-in">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200/50 bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-gray-800 to-black text-white rounded-xl shadow-lg">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Admin Console</h2>
                        <p className="text-xs text-gray-500 font-medium">System Overview</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                    <X size={20} />
                </button>
            </div>
            
            {/* Tabs & Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 pb-2">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} /> Users ({users.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={16} /> System Logs ({logs.length})
                    </button>
                </div>
                
                <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-all"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">
                {activeTab === 'users' ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="p-4 font-semibold">User Info</th>
                                    <th className="p-4 font-semibold">Joined</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{user.businessName}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600">
                                                {new Date(user.joinedAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${user.isVerified ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => {
                                                    if(confirm('Are you sure you want to delete this user?')) {
                                                        authService.deleteAccount(user.email).then(() => {
                                                            setUsers(authService.getAllUsers());
                                                        });
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            No users found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="p-4 font-semibold">Time</th>
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">Action</th>
                                    <th className="p-4 font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLogs.map((log, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600 font-mono">
                                            {log.time}
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-gray-900 text-xs">{log.user}</p>
                                                <p className="text-[10px] text-gray-400">{log.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                                ${log.action === 'call' ? 'bg-blue-50 text-blue-700' : ''}
                                                ${log.action === 'complete' ? 'bg-green-50 text-green-700' : ''}
                                                ${log.action === 'skip' ? 'bg-orange-50 text-orange-700' : ''}
                                            `}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            Ticket #{log.ticket}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;