
import React, { useState, useEffect } from 'react';
import { QueueData, Visitor } from '../types';
import { queueService } from '../services/queue';
import { LogOut, Zap, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [joinName, setJoinName] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  // Poll for updates
  useEffect(() => {
    const fetchData = () => {
        const data = queueService.getQueueData(queueId);
        setQueueData(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [queueId]);

  useEffect(() => {
    if (myVisitorId && queueData) {
        const visitor = queueData.visitors.find(v => v.id === myVisitorId);
        if (visitor && (visitor.status === 'waiting' || visitor.status === 'serving')) {
            setIsJoined(true);
        } else {
            // Expired or Removed
            if (isJoined) setIsJoined(false);
        }
    }
  }, [queueData, myVisitorId]);

  const handleJoin = (e: React.FormEvent) => {
      e.preventDefault();
      const { visitor } = queueService.joinQueue(queueId, joinName);
      setMyVisitorId(visitor.id);
      localStorage.setItem(`qblink_visit_${queueId}`, visitor.id);
      setIsJoined(true);
  };

  const handleLeave = () => {
      if (myVisitorId) {
          queueService.leaveQueue(queueId, myVisitorId);
          localStorage.removeItem(`qblink_visit_${queueId}`);
          setMyVisitorId(null);
          setIsJoined(false);
      }
  };

  if (!queueData) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Queue...</div>;

  // Not Joined View
  if (!isJoined) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] shadow-xl p-8"
              >
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                          <Users size={32} />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">Join the Queue</h1>
                      <p className="text-gray-500 mt-2">Enter your name to hold your spot.</p>
                  </div>
                  
                  <form onSubmit={handleJoin}>
                      <input 
                        required
                        type="text" 
                        placeholder="Your Name" 
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-lg"
                      />
                      <button type="submit" className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-primary-700 transition-all">
                          Get a Number
                      </button>
                  </form>
                  <p className="text-center text-xs text-gray-400 mt-6">Powered by Qblink</p>
              </motion.div>
          </div>
      );
  }

  const myVisitor = queueData.visitors.find(v => v.id === myVisitorId);
  if (!myVisitor) return null; // Should ideally show error or reset

  const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length;
  const waitTime = Math.max(1, peopleAhead * queueData.metrics.avgWaitTime);
  const isOnTime = myVisitor.status === 'serving' || (peopleAhead === 0 && myVisitor.status === 'waiting');

  // Active View (My Ticket)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl overflow-hidden relative border-[6px] border-gray-900 min-h-[700px] flex flex-col">
            
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md p-6 pb-4 z-10 border-b border-gray-100">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Queue #{queueId.slice(0,4)}</h3>
                        <p className="text-gray-400 text-xs font-medium">Your Turn is Coming</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                        Live
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 bg-dots">
                <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="w-full bg-white rounded-[32px] p-8 shadow-xl shadow-blue-900/5 border border-white flex flex-col items-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Your Number</span>
                    <div className="text-9xl font-black text-gray-900 mb-4 tracking-tighter leading-none">
                        {myVisitor.ticketNumber}
                    </div>
                    
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isOnTime ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                        <Zap size={16} fill="currentColor" />
                        {myVisitor.status === 'serving' ? "It's your turn!" : isOnTime ? "Get Ready!" : "On Time"}
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center">
                        <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Wait Time</span>
                        <span className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                            ~{waitTime}<span className="text-sm font-medium text-gray-400">m</span>
                        </span>
                    </div>
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center">
                        <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Ahead</span>
                        <span className="text-3xl font-bold text-gray-900">{peopleAhead}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 z-10 mt-auto">
                <button 
                    onClick={handleLeave}
                    className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <LogOut size={20} /> Leave Queue
                </button>
            </div>
        </div>
    </div>
  );
};

export default CustomerView;
