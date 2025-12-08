

import React, { useState, useEffect, useRef } from 'react';
import { QueueData, Visitor, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { LogOut, Zap, Users, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [joinName, setJoinName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [alertShown, setAlertShown] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Poll for updates
  useEffect(() => {
    const fetchData = () => {
        const data = queueService.getQueueData(queueId);
        const info = queueService.getQueueInfo(queueId);
        setQueueInfo(info);
        setQueueData(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [queueId]);

  // Handle Logic updates
  useEffect(() => {
    if (myVisitorId && queueData) {
        const visitor = queueData.visitors.find(v => v.id === myVisitorId);
        if (visitor && (visitor.status === 'waiting' || visitor.status === 'serving')) {
            setIsJoined(true);
            
            const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < visitor.ticketNumber).length;

            // 1. Proximity Alert (2 people ahead)
            if (peopleAhead === 2 && !alertShown && visitor.status === 'waiting') {
                setShowNotificationPopup(true);
                setAlertShown(true);
                if (Notification.permission === 'granted') {
                    new Notification(`Get Ready!`, { body: `Only 2 people ahead of you in ${queueInfo?.name || 'the queue'}.` });
                }
            }

            // 2. Called Alert (Sound)
            if (visitor.status === 'serving') {
                 playAlertSound();
            }

        } else {
            // Expired or Removed
            if (isJoined) setIsJoined(false);
        }
    }
  }, [queueData, myVisitorId, alertShown, queueInfo?.name]);

  const requestNotificationPermission = () => {
     if ('Notification' in window && Notification.permission !== 'granted') {
         Notification.requestPermission();
     }
  };

  const playAlertSound = () => {
    if (!audioContextRef.current) {
         // Create context if not exists
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (common in browsers)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // Check if already playing? We'll just play a pulse.
    // Create oscillator
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Beep pattern
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

    // Volume 150% (Gain 1.5)
    gainNode.gain.setValueAtTime(1.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); // Fade out beep

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Loop for ~6 seconds (approx 10 beeps)
    let count = 0;
    const interval = setInterval(() => {
        if (count > 10) {
             clearInterval(interval);
             return;
        }
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(600, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);
        g.gain.setValueAtTime(1.5, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        o.start();
        o.stop(ctx.currentTime + 0.4);
        count++;
    }, 600);
  };

  const handleJoin = (e: React.FormEvent) => {
      e.preventDefault();
      requestNotificationPermission();
      const { visitor } = queueService.joinQueue(queueId, joinName);
      setMyVisitorId(visitor.id);
      localStorage.setItem(`qblink_visit_${queueId}`, visitor.id);
      setIsJoined(true);
      
      // Initialize audio context on user interaction
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  };

  const handleLeave = () => {
      if (myVisitorId) {
          queueService.leaveQueue(queueId, myVisitorId);
          localStorage.removeItem(`qblink_visit_${queueId}`);
          setMyVisitorId(null);
          setIsJoined(false);
          setAlertShown(false);
      }
  };

  if (!queueData) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">Loading Queue...</div>;

  // Not Joined View
  if (!isJoined) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] shadow-xl p-8"
              >
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                          <Users size={32} />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900">{queueInfo ? queueInfo.name : 'Join Queue'}</h1>
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
  if (!myVisitor) return null;

  const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length;
  // Use manual estimate from config if available, else calculated metric
  const waitTime = Math.max(1, peopleAhead * queueData.metrics.avgWaitTime);
  const isOnTime = myVisitor.status === 'serving' || (peopleAhead === 0 && myVisitor.status === 'waiting');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
        {/* Borderless Mobile Layout */}
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-50 sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{queueInfo?.name || 'Queue'}</h3>
                    <p className="text-gray-400 text-xs font-medium">Your Turn is Coming</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                    Live
                </span>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
            
            {/* Ticket Card - No border on mobile, subtle shadow */}
            <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-full max-w-sm bg-gray-50 rounded-[40px] p-8 flex flex-col items-center relative overflow-hidden"
            >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-2 ${isOnTime ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-2">Your Number</span>
                <div className="text-[120px] font-black text-gray-900 mb-4 tracking-tighter leading-none">
                    {myVisitor.ticketNumber}
                </div>
                
                <motion.div 
                    animate={isOnTime ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-bold shadow-sm ${isOnTime ? 'bg-green-100 text-green-700' : 'bg-white text-blue-600 border border-blue-100'}`}
                >
                    <Zap size={18} fill="currentColor" />
                    {myVisitor.status === 'serving' ? "It's your turn!" : isOnTime ? "Get Ready!" : "On Time"}
                </motion.div>
            </motion.div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Est. Wait</span>
                    <span className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                        ~{waitTime}<span className="text-sm font-medium text-gray-400">m</span>
                    </span>
                </div>
                <div className="bg-gray-50 p-6 rounded-[32px] flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase mb-2">Ahead</span>
                    <span className="text-3xl font-bold text-gray-900">{peopleAhead}</span>
                </div>
            </div>
        </div>

        {/* Pop-up Notification for "2 Ahead" */}
        <AnimatePresence>
            {showNotificationPopup && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-50"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-full text-yellow-400">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Almost there!</p>
                            <p className="text-xs text-gray-400">Only 2 people ahead of you.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowNotificationPopup(false)} className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg">
                        OK
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Footer */}
        <div className="p-6 z-10 mt-auto bg-white">
            <button 
                onClick={handleLeave}
                className="w-full py-4 bg-white text-red-600 border-2 border-red-50 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:bg-red-50 active:scale-95 transition-all"
            >
                <LogOut size={20} /> Leave Queue
            </button>
        </div>
    </div>
  );
};

export default CustomerView;
