
import React, { useState, useEffect } from 'react';
import { QueueData, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { motion as m, AnimatePresence } from 'framer-motion';

const motion = m as any;

interface DisplayViewProps {
  queueId: string;
}

const DisplayView: React.FC<DisplayViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);

  useEffect(() => {
      // 1. Get Info
      queueService.getQueueInfo(queueId).then(setQueueInfo);
      
      // 2. Stream Data
      const unsub = queueService.streamQueueData(queueId, (data) => {
          setQueueData(data);
      });
      return () => unsub();
  }, [queueId]);

  if (!queueData || !queueInfo) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const current = queueData.visitors.find(v => v.status === 'serving');
  const next = queueData.visitors.filter(v => v.status === 'waiting').slice(0, 4);

  return (
    <div className="h-screen bg-gray-900 text-white p-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
            <h1 className="text-4xl font-bold">{queueInfo.name}</h1>
            <div className="text-2xl font-mono text-gray-400">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>

        <div className="flex-1 flex gap-8">
            {/* Main Display */}
            <div className="w-2/3 bg-black rounded-[40px] border border-gray-800 flex flex-col items-center justify-center text-center p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
                <h2 className="text-gray-500 font-bold text-3xl uppercase tracking-[0.3em] mb-4 relative z-10">Now Serving</h2>
                
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={current?.ticketNumber || 'none'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10"
                    >
                        <div className="text-[250px] font-black leading-none text-white tracking-tighter">
                            {current ? String(current.ticketNumber).padStart(3, '0') : '---'}
                        </div>
                        {current && (
                            <div className="text-4xl font-bold text-blue-400 mt-4 px-8 py-4 bg-blue-900/30 rounded-2xl inline-block border border-blue-500/30">
                                {current.servedBy || 'Counter 1'}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Sidebar List */}
            <div className="w-1/3 bg-gray-800/50 rounded-[40px] p-8 border border-gray-800">
                <h3 className="text-gray-400 font-bold text-xl uppercase tracking-widest mb-6">Up Next</h3>
                <div className="space-y-4">
                    <AnimatePresence>
                        {next.map((v, i) => (
                            <motion.div 
                                key={v.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gray-800 p-6 rounded-3xl flex items-center justify-between border border-gray-700"
                            >
                                <span className="text-4xl font-bold text-white">{String(v.ticketNumber).padStart(3, '0')}</span>
                                <span className="text-gray-400 font-medium">Waiting</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {next.length === 0 && <div className="text-gray-600 text-center py-12">Queue Empty</div>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DisplayView;
