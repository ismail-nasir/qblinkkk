
import React, { useState, useEffect } from 'react';
import { User, QueueInfo, QueueData } from '../types';
import { queueService } from '../services/queue';
import { Plus, LayoutGrid, Clock, Users, ArrowRight, ExternalLink, Activity, Copy, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueListProps {
  user: User;
  onSelectQueue: (queue: QueueInfo) => void;
}

const QueueList: React.FC<QueueListProps> = ({ user, onSelectQueue }) => {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [queueStats, setQueueStats] = useState<Record<string, QueueData>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');

  useEffect(() => {
    loadQueues();
  }, [user.id]);

  const loadQueues = () => {
    const userQueues = queueService.getUserQueues(user.id);
    setQueues(userQueues);
    
    // Load stats for each queue
    const stats: Record<string, QueueData> = {};
    userQueues.forEach(q => {
        stats[q.id] = queueService.getQueueData(q.id);
    });
    setQueueStats(stats);
  };

  const handleCreateQueue = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newQueueName.trim()) return;
      queueService.createQueue(user.id, newQueueName);
      setNewQueueName('');
      setShowCreateModal(false);
      loadQueues();
  };

  const handleDeleteQueue = (e: React.MouseEvent, queueId: string) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this queue? All data will be lost.")) {
          queueService.deleteQueue(user.id, queueId);
          loadQueues();
      }
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.businessName}</h1>
              <p className="text-gray-500">Manage your queues and monitor real-time statuses.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95"
          >
              <Plus size={20} /> Create Queue
          </button>
      </div>

      <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <LayoutGrid size={24} className="text-primary-600" /> Your Queues
          </h2>
          
          {queues.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <LayoutGrid size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No queues yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first queue to start managing visitors efficiently.</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                      Create Now
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {queues.map((queue, index) => {
                      const stats = queueStats[queue.id];
                      return (
                        <motion.div
                            key={queue.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 relative group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{queue.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                                        Code: <span className="text-gray-900 font-bold bg-gray-100 px-1.5 py-0.5 rounded">{queue.code}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${queue.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {queue.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-blue-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-blue-100">
                                    <Activity size={16} className="text-blue-500 mb-2" />
                                    <span className="text-2xl font-bold text-gray-900">#{String(stats?.currentTicket || 0).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Current</span>
                                </div>
                                <div className="bg-green-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-green-100">
                                    <Users size={16} className="text-green-500 mb-2" />
                                    <span className="text-2xl font-bold text-gray-900">{stats?.metrics.served || 0}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Served</span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100">
                                    <Clock size={16} className="text-gray-500 mb-2" />
                                    <span className="text-2xl font-bold text-gray-900">
                                        {stats?.metrics.avgWaitTime || 0}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">min/avg</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => onSelectQueue(queue)}
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
                                >
                                    <Activity size={18} /> Manage
                                </button>
                                <button 
                                    onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')}
                                    className="w-12 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all"
                                    title="Open Public Display"
                                >
                                    <ExternalLink size={20} />
                                </button>
                            </div>

                             {/* Delete Button (Hidden by default, shows on hover) */}
                            <button
                                onClick={(e) => handleDeleteQueue(e, queue.id)}
                                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Queue"
                            >
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* Create Queue Modal */}
      <AnimatePresence>
          {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full"
                  >
                      <h3 className="text-2xl font-bold mb-2">Create New Queue</h3>
                      <p className="text-gray-500 mb-6">Give your queue a name to get started.</p>
                      
                      <form onSubmit={handleCreateQueue}>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Queue Name</label>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="e.g. Counter 1, Takeout, Dr. Smith" 
                            value={newQueueName}
                            onChange={(e) => setNewQueueName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-lg font-medium"
                          />
                          
                          <div className="flex gap-3">
                              <button 
                                type="button" 
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                              >
                                  Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20"
                              >
                                  Create Queue
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default QueueList;
