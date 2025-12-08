

import React, { useState, useEffect } from 'react';
import { QueueData, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { motion, AnimatePresence } from 'framer-motion';

interface DisplayViewProps {
  queueId: string;
}

const DisplayView: React.FC<DisplayViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = () => {
        const data = queueService.getQueueData(queueId);
        const info = queueService.getQueueInfo(queueId);
        setQueueData(data);
        setQueueInfo(info);
        setLoading(false);
    };
    fetchData();

    // Poll for updates
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [queueId]);

  if (loading || !queueData) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xl font-mono text-gray-400">Connecting to Display...</div>
              </div>
          </div>
      );
  }

  // Filter visitors who are waiting, sorted by ticket number
  const nextVisitors = queueData.visitors
    .filter(v => v.status === 'waiting')
    .sort((a,b) => a.ticketNumber - b.ticketNumber)
    .slice(0, 5); // Show next 5

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 flex flex-col overflow-hidden font-sans selection:bg-primary-500/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-primary-600/20">
                Q
              </div>
              <div>
                  {queueInfo && <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{queueInfo.name}</h1>}
                  <p className="text-gray-400 text-sm">Real-time Status</p>
              </div>
          </div>
          <div className="text-right hidden md:block">
              <div className="text-3xl font-mono font-bold text-gray-200">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-500 font-medium uppercase tracking-widest text-xs mt-1">
                  {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric'})}
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-8 lg:gap-16 h-full min-h-0">
          {/* Main Section: Now Serving */}
          <div className="w-full lg:w-2/3 bg-gray-900 rounded-[48px] p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gray-800 shadow-2xl">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/50 to-transparent pointer-events-none"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 md:mb-8 relative z-10">Now Serving</h2>
              
              <div className="relative z-10 py-4 md:py-8">
                  <AnimatePresence mode="wait">
                      <motion.div 
                        key={queueData.lastCalledNumber}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="text-[120px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-2xl"
                      >
                          {String(queueData.lastCalledNumber).padStart(3, '0')}
                      </motion.div>
                  </AnimatePresence>
              </div>

              <div className="mt-8 text-xl md:text-3xl font-medium text-primary-400 flex items-center gap-4 bg-primary-500/10 px-6 py-3 md:px-8 md:py-4 rounded-full border border-primary-500/20">
                  <span className="relative flex h-3 w-3 md:h-4 md:w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-primary-500"></span>
                  </span>
                  Please proceed to counter
              </div>
          </div>

          {/* Sidebar: Up Next */}
          <div className="w-full lg:w-1/3 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Up Next</h3>
                  <div className="px-3 py-1 bg-gray-800 rounded-lg text-gray-400 text-sm font-bold border border-gray-700">
                      {queueData.metrics.waiting} Waiting
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {nextVisitors.length > 0 ? (
                      <AnimatePresence initial={false}>
                          {nextVisitors.map((v, i) => (
                              <motion.div 
                                key={v.id}
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 md:p-6 flex items-center justify-between transition-colors shadow-lg"
                              >
                                  <div className="flex items-center gap-6">
                                      <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center text-2xl font-bold text-white group-hover:bg-gray-700 transition-colors border border-gray-700">
                                          {String(v.ticketNumber).padStart(3, '0')}
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-lg text-gray-200 font-bold truncate max-w-[150px]">{v.name}</span>
                                          <span className="text-xs text-gray-500 font-mono">Visitor</span>
                                      </div>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-primary-500 transition-colors"></div>
                              </motion.div>
                          ))}
                      </AnimatePresence>
                  ) : (
                      <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl">
                          <span className="text-gray-600 italic text-xl">The queue is empty</span>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default DisplayView;
