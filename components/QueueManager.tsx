
import React, { useState, useEffect, useRef } from 'react';
import { User, QueueData, QueueInfo, Visitor } from '../types';
import { queueService } from '../services/queue';
import { 
    Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, 
    ArrowLeft, Bell, PauseCircle, Megaphone, Star, MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';

interface QueueManagerProps {
  user: User;
  queue: QueueInfo;
  onBack: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user, queue, onBack }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [counterName, setCounterName] = useState(localStorage.getItem('qblink_counter_name') || 'Counter 1');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Real-time Listener
  useEffect(() => {
      const unsub = queueService.streamQueueData(queue.id, (data) => {
          setQueueData(data);
      });
      return () => unsub();
  }, [queue.id]);

  // QR Code Generation
  useEffect(() => {
    if (showQrModal && canvasRef.current) {
        const url = `${window.location.origin}?view=customer&queueId=${queue.id}`;
        QRCode.toCanvas(canvasRef.current, url, { width: 300, margin: 2 }, (error: any) => {
            if (error) console.error(error);
        });
    }
  }, [showQrModal, queue.id]);

  const handleCallNext = async () => {
      await queueService.callNext(queue.id, counterName);
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newVisitorName) return;
      await queueService.joinQueue(queue.id, newVisitorName, undefined, 'manual');
      setNewVisitorName('');
      setShowAddModal(false);
  };

  const handleClearQueue = async () => {
      if(confirm("Remove all waiting customers?")) {
          await queueService.clearQueue(queue.id);
      }
  };

  if (!queueData) return <div className="p-12 text-center text-gray-400">Loading live data...</div>;

  const waiting = queueData.visitors.filter(v => v.status === 'waiting');
  const serving = queueData.visitors.find(v => v.status === 'serving' && v.servedBy === counterName);

  return (
    <div className="container mx-auto px-4 pb-20 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {queue.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded font-bold">{queue.code}</span>
                    <MapPin size={14} />
                    <input 
                        className="bg-transparent border-b border-dashed border-gray-300 focus:border-primary-500 outline-none w-24 text-gray-700 font-bold"
                        value={counterName}
                        onChange={(e) => {
                            setCounterName(e.target.value);
                            localStorage.setItem('qblink_counter_name', e.target.value);
                        }} 
                    />
                </div>
            </div>
        </div>
        
        <div className="flex gap-2">
             <button onClick={() => setShowQrModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">
                <QrCode size={18} /> QR Code
            </button>
             <button onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm">
                <Share2 size={20} />
            </button>
        </div>
      </div>

      {/* Now Serving */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-8 text-center border border-white shadow-sm mb-8">
          <p className="text-gray-500 font-medium mb-4 uppercase tracking-widest text-xs">Serving at {counterName}</p>
          {serving ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div className="text-8xl font-black text-gray-900 mb-2">{String(serving.ticketNumber).padStart(3, '0')}</div>
                  <div className="text-xl font-bold text-blue-600 mb-6">{serving.name}</div>
                  <div className="flex justify-center gap-4">
                      {serving.isAlerting && <span className="animate-pulse text-red-500 font-bold flex items-center gap-1"><Bell size={16}/> Calling...</span>}
                  </div>
              </motion.div>
          ) : (
              <div className="text-6xl font-bold text-gray-300 py-8">---</div>
          )}
          
          <div className="flex justify-center gap-4 mt-6">
              <button onClick={handleCallNext} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-600/20 hover:bg-primary-700 flex items-center gap-2">
                  Call Next <Phone size={20} />
              </button>
          </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button onClick={() => setShowAddModal(true)} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 flex flex-col items-center gap-2">
              <UserPlus size={24} /> <span className="text-sm">Add Visitor</span>
          </button>
          <button onClick={handleClearQueue} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-red-500 hover:bg-red-50 flex flex-col items-center gap-2">
              <Trash2 size={24} /> <span className="text-sm">Clear Queue</span>
          </button>
      </div>

      {/* Waiting List */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Waiting ({queueData.metrics.waiting})</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {waiting.map(v => (
                  <div key={v.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-600">
                              {v.ticketNumber}
                          </div>
                          <div>
                              <p className="font-bold text-gray-900">{v.name}</p>
                              <p className="text-xs text-gray-400">Joined {new Date(v.joinTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                      </div>
                      <button onClick={() => queueService.leaveQueue(queue.id, v.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
              ))}
              {waiting.length === 0 && <div className="p-8 text-center text-gray-400">Queue is empty</div>}
          </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
          {showQrModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl text-center" onClick={e => e.stopPropagation()}>
                      <h3 className="text-2xl font-bold mb-4">Scan to Join</h3>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 inline-block mb-6">
                          <canvas ref={canvasRef} />
                      </div>
                      <p className="text-gray-500 text-sm mb-6">Show this to your customers</p>
                      <button onClick={() => setShowQrModal(false)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">Close</button>
                  </motion.div>
              </div>
          )}
          
          {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-sm">
                      <h3 className="text-xl font-bold mb-4">Add Customer</h3>
                      <form onSubmit={handleAddVisitor}>
                          <input autoFocus type="text" placeholder="Name" value={newVisitorName} onChange={e => setNewVisitorName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl mb-4 border border-gray-200" />
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Add</button>
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
