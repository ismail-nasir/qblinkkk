
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueueData, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { LogOut, Zap, Users, Bell, CheckCircle } from 'lucide-react';
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
  
  // Sound loop control
  const [isAlerting, setIsAlerting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<number | null>(null);

  const fetchData = useCallback(() => {
        const data = queueService.getQueueData(queueId);
        const info = queueService.getQueueInfo(queueId);
        setQueueInfo(info);
        setQueueData(data);
  }, [queueId]);

  // Poll for updates and listen to storage events
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.startsWith('qblink_data_')) {
            fetchData();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchData]);

  // Handle Logic updates
  useEffect(() => {
    if (myVisitorId && queueData) {
        const visitor = queueData.visitors.find(v => v.id === myVisitorId);
        if (visitor && (visitor.status === 'waiting' || visitor.status === 'serving')) {
            setIsJoined(true);
            
            // Check for Alert Trigger
            if (visitor.isAlerting && !isAlerting) {
                 setIsAlerting(true);
                 startAlertLoop();
            } else if (!visitor.isAlerting && isAlerting) {
                 setIsAlerting(false);
                 stopAlertLoop();
            }
            
            const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < visitor.ticketNumber).length;

            // 1. Proximity Alert (2 people ahead) - Only once
            if (peopleAhead === 2 && !alertShown && visitor.status === 'waiting') {
                setShowNotificationPopup(true);
                setAlertShown(true);
                if (Notification.permission === 'granted') {
                    new Notification(`Get Ready!`, { body: `Only 2 people ahead of you in ${queueInfo?.name || 'the queue'}.` });
                }
            }
        } else {
            // Expired or Removed or doesn't exist anymore
            // We only unjoin if we are sure queueData is robust.
            if (isJoined && queueData.visitors.length > 0) {
                 // Double check if actually removed or just data sync issue?
                 // For safety, only reset if queueData is robust.
                 setIsJoined(false);
                 setMyVisitorId(null);
                 localStorage.removeItem(`qblink_visit_${queueId}`);
                 stopAlertLoop();
            } else if (!isJoined && visitor) {
                 // Recovery logic for refresh
                 setIsJoined(true);
            }
        }
    }
  }, [queueData, myVisitorId, alertShown, queueInfo?.name]);

  const requestNotificationPermission = () => {
     if ('Notification' in window && Notification.permission !== 'granted') {
         Notification.requestPermission();
     }
  };

  const startAlertLoop = () => {
      // Play immediately
      playBeep();
      // Loop
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = window.setInterval(playBeep, 2000);
  };

  const stopAlertLoop = () => {
      if (alertIntervalRef.current) {
          clearInterval(alertIntervalRef.current);
          alertIntervalRef.current = null;
      }
  };

  const playBeep = () => {
    // Check if sound is enabled for this queue
    if (queueInfo?.settings?.soundEnabled === false) return;

    const volume = queueInfo?.settings?.soundVolume || 1.0;
    const soundType = queueInfo?.settings?.soundType || 'beep';

    if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Apply Volume
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    // Generate Sound based on Type
    switch (soundType) {
        case 'chime':
            // Soft sine wave with long decay
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 1.5);
            break;

        case 'alarm':
            // Harsh sawtooth wave
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(volume, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            break;

        case 'beep':
        default:
             // Standard Square Wave Beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
            break;
    }
  };

  const handleJoin = (e: React.FormEvent) => {
      e.preventDefault();
      requestNotificationPermission();
      
      // Initialize Audio Context on user gesture
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

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
          setAlertShown(false);
          stopAlertLoop();
          setIsAlerting(false);
      }
  };

  const handleImComing = () => {
      if (myVisitorId) {
          queueService.dismissAlert(queueId, myVisitorId);
          setIsAlerting(false);
          stopAlertLoop();
      }
  };

  // Loading state handling for persistence check
  // If we have a stored ID but no queueData yet, show loading
  if (myVisitorId && !queueData) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-sans gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Restoring your ticket...</p>
          </div>
      );
  }

  // If we have queueData but the visitor ID is not in it (and we had a stored ID), it means we were removed/served long ago
  // The useEffect handles the cleanup of isJoined/localStorage in that case.

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
  // Fallback if joined state is true but visitor not found (e.g. slight sync delay or removed)
  if (!myVisitor) {
       // Logic to return to home handled by useEffect, but render safe fallback
       return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Updating status...</p>
            </div>
       );
  }

  const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length;
  // Use manual estimate from config if available, else calculated metric
  const waitTime = Math.max(1, peopleAhead * queueData.metrics.avgWaitTime);
  const isOnTime = myVisitor.status === 'serving' || (peopleAhead === 0 && myVisitor.status === 'waiting');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8">
            
            {/* Queue Info */}
            <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-gray-900">{queueInfo?.name || 'Queue'}</h3>
                 <div className="flex items-center justify-center gap-2">
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-green-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                        Live Updates
                    </span>
                 </div>
            </div>

            {/* Ticket Card */}
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

        {/* ALERT OVERLAY (I'm Coming) */}
        <AnimatePresence>
            {isAlerting && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-blue-600 flex flex-col items-center justify-center p-8 text-center"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                    >
                        <Bell size={48} className="text-blue-600" fill="currentColor" />
                    </motion.div>
                    
                    <h2 className="text-4xl font-black text-white mb-4">It's Your Turn!</h2>
                    <p className="text-blue-100 text-lg mb-12 max-w-xs">
                        Please proceed to the counter immediately. We are waiting for you.
                    </p>
                    
                    <button 
                        onClick={handleImComing}
                        className="w-full max-w-xs py-5 bg-white text-blue-600 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                    >
                        <CheckCircle size={24} /> I'M COMING
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Pop-up Notification for "2 Ahead" (Non-intrusive) */}
        <AnimatePresence>
            {showNotificationPopup && !isAlerting && (
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
