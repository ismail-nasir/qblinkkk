
import React, { useState, useEffect } from 'react';
import { User, QueueInfo, BusinessType, QueueFeatures } from '../types';
import { queueService } from '../services/queue';
import { Plus, LayoutGrid, Activity, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueListProps {
  user: User;
  onSelectQueue: (queue: QueueInfo) => void;
  locationId?: string; // Made optional for TS but required by logic
  businessId?: string;
}

export const QueueList: React.FC<QueueListProps> = ({ user, onSelectQueue, locationId, businessId }) => {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Form
  const [newQueueName, setNewQueueName] = useState('');
  const [estWait, setEstWait] = useState('5');

  useEffect(() => {
      if (businessId && locationId) {
          const unsub = queueService.getLocationQueues(businessId, locationId, (data) => {
              setQueues(data);
          });
          return () => unsub();
      }
  }, [businessId, locationId]);

  const handleCreateQueue = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newQueueName || !businessId || !locationId) return;
      
      await queueService.createQueue(
          businessId, 
          newQueueName, 
          parseInt(estWait), 
          'general', 
          { vip: true, multiCounter: true, anonymousMode: false, sms: false },
          locationId
      );
      setNewQueueName('');
      setShowCreateModal(false);
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Queues in this Location</h2>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all">
              <Plus size={16} /> New Queue
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map((queue, idx) => (
              <motion.div 
                key={queue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative"
              >
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900">{queue.name}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-1">Code: {queue.code}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase">Active</span>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => onSelectQueue(queue)} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                          <Activity size={16} /> Manage
                      </button>
                      <button onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')} className="w-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-100 border border-gray-200">
                          <ExternalLink size={18} />
                      </button>
                  </div>
              </motion.div>
          ))}
      </div>

      {queues.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-3xl">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <LayoutGrid size={24} />
              </div>
              <p className="text-gray-900 font-bold mb-1">No queues here</p>
              <p className="text-gray-500 text-sm">Create a queue to get started.</p>
          </div>
      )}

      {/* Simple Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full"
            >
                <h3 className="text-xl font-bold mb-4">Create Queue</h3>
                <form onSubmit={handleCreateQueue} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Queue Name</label>
                        <input autoFocus type="text" value={newQueueName} onChange={e => setNewQueueName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Reception" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Est. Wait (Mins)</label>
                        <input type="number" value={estWait} onChange={e => setEstWait(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm">Create</button>
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
