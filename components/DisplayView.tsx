import React, { useState, useEffect, useCallback } from 'react';
import { QueueData, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

interface DisplayViewProps {
  queueId: string;
}

const DisplayView: React.FC<DisplayViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
      try {
          const data = await queueService.getQueueData(queueId);
          const info = await queueService.getQueueInfo(queueId);
          setQueueData(data);
          setQueueInfo(info);
          setLoading(false);
      } catch (e) {
          console.error(e);
      }
  }, [queueId]);

  useEffect(() => {
    fetchData();

    // Join Room
    socketService.joinQueue(queueId);

    // Listen
    socketService.on('queue:update', () => {
        fetchData();
    });

    return () => {
        socketService.off('queue:update');
    };
  }, [fetchData, queueId]);

  if (loading || !queueData) {
      return (
          <div className="h-screen w-screen bg-gray-950 text-white flex items-center justify-center overflow-hidden">
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
    <div className="h-screen w-screen bg-gray-950 text-white p-4 md:p-6 flex flex-col overflow-hidden font-sans selection:bg-primary-500/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-gray-800 pb-4 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-600 rounded-2xl flex items-center justify-center font-bold text-2xl md:text-4xl shadow-lg shadow-primary-600/20 text-white">
                Q
              </div>
              <div>
                  {queueInfo && <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1 truncate max-w-[50vw]">{queueInfo.name}</h1>}
                  <p className="text-gray-400 text-sm md:text-base">Real-time Status</p>
              </div>
          </div>
          <div className="text-right hidden md:block">
              <div className="text-3xl md:text-5xl font-mono font-bold text-gray-200">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-500 font-medium uppercase tracking-widest text-xs md:text-sm mt-1">
                  {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric'})}
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-8 h-full min-h-0 overflow-hidden">
          {/* Main Section: Now Serving */}
          <div className="w-full lg:w-2/3 bg-gray-900 rounded-[32px] md:rounded-[48px] p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gray-800 shadow-2xl shrink-0 lg:shrink">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/50 to-transparent pointer-events-none"></div>
              
              <h2 className="text-2xl md:text-4xl font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 md:mb-4 relative z-10">Now Serving</h2>
              
              <div className="relative z-10 flex-1 flex items-center justify-center w-full">
                  <AnimatePresence mode="wait">
                      <motion.div 
                        key={queueData.lastCalledNumber}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="text-[140px] md:text-[240px] xl:text-[300px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-2xl select-none"
                      >
                          {String(queueData.lastCalledNumber).padStart(3, '0')}
                      </motion.div>
                  </AnimatePresence>
              </div>

              <div className="mt-4 md:mt-8 text-lg md:text-2xl font-medium text-primary-400 flex items-center gap-3 md:gap-4 bg-primary-500/10 px-6 py-3 md:px-8 md:py-4 rounded-full border border-primary-500/20">
                  <span className="relative flex h-3 w-3 md:h-4 md:w-4 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-primary-500"></span>
                  </span>
                  Please proceed to counter
              </div>
          </div>

          {/* Sidebar: Up Next */}
          <div className="w-full lg:w-1/3 flex flex-col h-full min-h-0 bg-gray-900/50 rounded-[32px] border border-gray-800/50 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6 px-2 shrink-0">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-400 uppercase tracking-widest">Up Next</h3>
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
                                className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 md:p-5 flex items-center justify-between transition-colors shadow-lg"
                              >
                                  <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-800 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold text-white group-hover:bg-gray-700 transition-colors border border-gray-700 shrink-0">
                                          {String(v.ticketNumber).padStart(3, '0')}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                          <span className="text-base md:text-lg text-gray-200 font-bold truncate">{v.name}</span>
                                          <span className="text-xs text-gray-500 font-mono">Visitor</span>
                                      </div>
                                  </div>
                                  <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-primary-500 transition-colors shrink-0"></div>
                              </motion.div>
                          ))}
                      </AnimatePresence>
                  ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl opacity-50">
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