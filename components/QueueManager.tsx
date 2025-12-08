
import React, { useState, useEffect } from 'react';
import { User, QueueData, Visitor } from '../types';
import { queueService } from '../services/queue';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueueManagerProps {
  user: User;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user }) => {
  const [queueData, setQueueData] = useState<QueueData>(queueService.getQueueData(user.id));
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);

  // Poll for updates (in case multiple devices/customers are interacting)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(queueService.getQueueData(user.id));
    }, 2000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleCallNext = () => {
    const newData = queueService.callNext(user.id);
    setQueueData(newData);
  };

  const handleCallByNumber = (e: React.FormEvent) => {
      e.preventDefault();
      const num = parseInt(callNumberInput);
      if (!isNaN(num)) {
          const newData = queueService.callByNumber(user.id, num);
          setQueueData(newData);
          setShowCallModal(false);
          setCallNumberInput('');
      }
  };

  const handleAddVisitor = (e: React.FormEvent) => {
      e.preventDefault();
      queueService.joinQueue(user.id, newVisitorName);
      setQueueData(queueService.getQueueData(user.id)); // Refresh
      setNewVisitorName('');
      setShowAddModal(false);
  };

  const handleRemoveVisitors = () => {
      if (confirm("Are you sure you want to clear the entire waiting list?")) {
          const newData = queueService.clearQueue(user.id);
          setQueueData(newData);
      }
  };

  const handleTakeBack = () => {
      const newData = queueService.takeBack(user.id);
      setQueueData(newData);
  };

  const waitingVisitors = queueData.visitors.filter(v => v.status === 'waiting');
  
  // URL for the QR Code
  // In a real app, this would be the actual URL. Here we simulate.
  const joinUrl = `${window.location.origin}?view=customer&queueId=${user.id}`;

  return (
    <div className="container mx-auto px-4 pb-20 max-w-5xl">
      {/* Top Bar */}
      <div className="flex justify-between items-center py-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.businessName}</h1>
            <p className="text-sm text-gray-500 font-mono">Queue ID: {user.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowQrModal(true)}
                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm"
            >
                <QrCode size={20} />
            </button>
             <button 
                onClick={() => window.open(`${window.location.origin}?view=display&queueId=${user.id}`, '_blank')}
                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm hidden md:block"
                title="Open Display Screen"
            >
                <Share2 size={20} />
            </button>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-8 text-center border border-white shadow-soft mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <p className="text-gray-500 font-medium mb-4 uppercase tracking-widest text-xs">Last called visitor number</p>
          
          <motion.div 
            key={queueData.lastCalledNumber}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[120px] leading-none font-black text-gray-900 mb-6 tracking-tighter"
          >
              {String(queueData.lastCalledNumber).padStart(3, '0')}
          </motion.div>

          <div className="flex items-center justify-center gap-2 text-gray-600 font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
              There are <span className="text-blue-600 font-bold">{queueData.metrics.waiting}</span> visitors waiting
          </div>

          <div className="max-w-md mx-auto">
              <button 
                onClick={handleCallNext}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-600/30 active:scale-95 transition-all mb-4 flex items-center justify-center gap-3"
              >
                  Call next visitor <Phone size={20} />
              </button>
          </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button 
            onClick={() => setShowCallModal(true)}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <Phone size={20} className="text-gray-400" />
              <span className="text-sm">Call by number</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <UserPlus size={20} className="text-gray-400" />
              <span className="text-sm">Add Visitor</span>
          </button>
          <button 
            onClick={handleRemoveVisitors}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:border-red-100 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <Trash2 size={20} className="text-red-400" />
              <span className="text-sm">Remove visitors</span>
          </button>
          <button 
            onClick={handleTakeBack}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <RotateCcw size={20} className="text-gray-400" />
              <span className="text-sm">Take back</span>
          </button>
      </div>

      {/* Waiting List - Removed Border */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Waiting List</h3>
              <span className="text-sm text-gray-500">{waitingVisitors.length} visitors</span>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {waitingVisitors.length > 0 ? waitingVisitors.map((visitor) => (
                  <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                              {String(visitor.ticketNumber).padStart(3, '0')}
                          </div>
                          <div>
                              <p className="font-bold text-gray-900">{visitor.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <Users size={12} /> Joined at {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                          </div>
                      </div>
                      <div className="text-right">
                           <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Wait</div>
                           <div className="font-mono text-gray-600">
                                ~{Math.max(1, (visitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                           </div>
                      </div>
                  </div>
              )) : (
                  <div className="p-12 text-center text-gray-400">
                      No visitors in the queue.
                  </div>
              )}
          </div>
      </div>

      {/* MODALS */}
      
      {/* QR Modal */}
      <AnimatePresence>
          {showQrModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
                  >
                      <h3 className="text-xl font-bold mb-2">Join Queue</h3>
                      <p className="text-gray-500 text-sm mb-6">Scan to join the queue instantly</p>
                      
                      <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block mb-6 shadow-sm">
                           {/* Use QR Server API for simplicity in this env */}
                           <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`} 
                                alt="Queue QR Code" 
                                className="w-48 h-48"
                           />
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <button 
                             onClick={() => {
                                 const link = document.createElement('a');
                                 link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(joinUrl)}`;
                                 link.download = 'queue-qr.png';
                                 link.target = '_blank';
                                 link.click();
                             }}
                             className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Download QR
                        </button>
                        <button onClick={() => setShowQrModal(false)} className="text-gray-500 font-bold text-sm py-2">Close</button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Add Visitor Modal */}
      <AnimatePresence>
          {showAddModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full"
                  >
                      <h3 className="text-lg font-bold mb-4">Add Visitor Manually</h3>
                      <form onSubmit={handleAddVisitor}>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Visitor Name (Optional)" 
                            value={newVisitorName}
                            onChange={(e) => setNewVisitorName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Add</button>
                          </div>
                      </form>
                  </motion.div>
               </div>
          )}
      </AnimatePresence>

       {/* Call By Number Modal */}
       <AnimatePresence>
          {showCallModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full"
                  >
                      <h3 className="text-lg font-bold mb-4">Call Specific Number</h3>
                      <form onSubmit={handleCallByNumber}>
                          <input 
                            autoFocus
                            type="number" 
                            placeholder="Ticket Number (e.g. 5)" 
                            value={callNumberInput}
                            onChange={(e) => setCallNumberInput(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-center text-xl font-bold"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowCallModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Call</button>
                          </div>
                      </form>
                  </motion.div>
               </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default QueueManager;
