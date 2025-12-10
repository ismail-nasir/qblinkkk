
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueueData, QueueInfo, Visitor } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { LogOut, Zap, Users, Bell, CheckCircle, Megaphone, PauseCircle, RefreshCw, Clock, MapPin, Phone, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [myVisitor, setMyVisitor] = useState<Visitor | null>(null);
  
  // Join Form State
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinError, setJoinError] = useState('');
  
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [alertShown, setAlertShown] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  
  // Refresh / Pull Logic
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sound loop control
  const [isAlerting, setIsAlerting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<number | null>(null);

  // Background Tab handling (Title blink)
  const titleIntervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
        try {
            const data = await queueService.getQueueData(queueId);
            const info = await queueService.getQueueInfo(queueId);
            setQueueInfo(info);
            setQueueData(data);
        } catch (e) {
            console.error(e);
        }
  }, [queueId]);

  useEffect(() => {
    fetchData();
    socketService.joinQueue(queueId);

    socketService.on('queue:update', () => {
        fetchData();
    });

    socketService.on('alert:ack', (data: any) => {
        if (data.visitorId === myVisitorId) {
            stopAlertLoop();
            setIsAlerting(false);
        }
    });

    return () => {
        socketService.off('queue:update');
        socketService.off('alert:ack');
    };
  }, [fetchData, queueId, myVisitorId]);

  // Handle Logic updates
  useEffect(() => {
    if (myVisitorId && queueData) {
        const visitor = queueData.visitors.find(v => v.id === myVisitorId);
        setMyVisitor(visitor || null);
        
        if (visitor) {
            // Check for Alert Trigger
            if (visitor.isAlerting && !isAlerting) {
                 setIsAlerting(true);
                 startAlertLoop();
                 startTitleBlink("🔔 YOUR TURN!");
            } else if (!visitor.isAlerting && isAlerting) {
                 setIsAlerting(false);
                 stopAlertLoop();
                 stopTitleBlink();
            }
            
            const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < visitor.ticketNumber).length;

            // 1. Proximity Alert (2 people ahead) - Only once
            if (peopleAhead === 2 && !alertShown && visitor.status === 'waiting') {
                setShowNotificationPopup(true);
                setAlertShown(true);
                sendNotification("Get Ready!", `Only 2 people ahead of you in ${queueInfo?.name || 'the queue'}.`);
            }
            
            // 2. Title Updates based on position
            if (!visitor.isAlerting) {
                if (visitor.status === 'waiting') {
                    document.title = `(${peopleAhead + 1}) Position - Qblink`;
                } else if (visitor.status === 'serving') {
                    document.title = `🔔 IT'S YOUR TURN!`;
                }
            }
        } else {
             // Visitor might have been deleted manually by admin
             // We don't auto-logout here to prevent UX jarring if it's a temp sync issue,
             // but if consistent, the UI will just show "Loading..." or we handle it in render.
        }
    } else {
        document.title = "Join Queue - Qblink";
    }
  }, [queueData, myVisitorId, alertShown, queueInfo?.name]);

  const sendNotification = (title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
      }
  };

  const startTitleBlink = (msg: string) => {
      if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
      let visible = true;
      titleIntervalRef.current = window.setInterval(() => {
          document.title = visible ? msg : "🔴 🔔 🔴";
          visible = !visible;
      }, 1000);
  };

  const stopTitleBlink = () => {
      if (titleIntervalRef.current) {
          clearInterval(titleIntervalRef.current);
          titleIntervalRef.current = null;
          document.title = "Qblink";
      }
  };

  // Pull to Refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
      if (window.scrollY === 0) {
          pullStartY.current = e.touches[0].clientY;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (pullStartY.current > 0 && !isRefreshing) {
          const y = e.touches[0].clientY;
          const diff = y - pullStartY.current;
          if (diff > 0 && window.scrollY <= 0) {
              setPullY(Math.min(diff * 0.4, 120)); 
          }
      }
  };

  const handleTouchEnd = async () => {
      if (pullY > 70) {
          setIsRefreshing(true);
          setPullY(70); 
          await fetchData();
          setTimeout(() => {
              setIsRefreshing(false);
              setPullY(0);
          }, 500);
      } else {
          setPullY(0);
      }
      pullStartY.current = 0;
  };

  const requestNotificationPermission = () => {
     if ('Notification' in window && Notification.permission !== 'granted') {
         Notification.requestPermission();
     }
  };

  const startAlertLoop = () => {
      playBeep();
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
    if (queueInfo?.settings?.soundEnabled === false) return;

    try {
        const volume = queueInfo?.settings?.soundVolume || 1.0;
        const soundType = queueInfo?.settings?.soundType || 'beep';

        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        switch (soundType) {
            case 'chime':
                const oscChime = ctx.createOscillator();
                oscChime.type = 'sine';
                oscChime.frequency.setValueAtTime(800, ctx.currentTime);
                oscChime.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                oscChime.connect(gainNode);
                oscChime.start(ctx.currentTime);
                oscChime.stop(ctx.currentTime + 1.5);
                break;
            case 'alarm':
                const oscAlarm = ctx.createOscillator();
                oscAlarm.type = 'sawtooth';
                oscAlarm.frequency.setValueAtTime(600, ctx.currentTime);
                oscAlarm.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                oscAlarm.connect(gainNode);
                oscAlarm.start(ctx.currentTime);
                oscAlarm.stop(ctx.currentTime + 0.5);
                break;
            case 'ding':
                const oscDing = ctx.createOscillator();
                oscDing.type = 'sine';
                oscDing.frequency.setValueAtTime(1200, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
                oscDing.connect(gainNode);
                oscDing.start(ctx.currentTime);
                oscDing.stop(ctx.currentTime + 1.0);
                break;
            case 'success':
                const oscS1 = ctx.createOscillator();
                const oscS2 = ctx.createOscillator();
                oscS1.type = 'sine';
                oscS2.type = 'triangle';
                oscS1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                oscS2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
                oscS1.connect(gainNode);
                oscS2.connect(gainNode);
                gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                oscS1.start(ctx.currentTime);
                oscS1.stop(ctx.currentTime + 0.8);
                oscS2.start(ctx.currentTime + 0.1);
                oscS2.stop(ctx.currentTime + 0.8);
                break;
            case 'beep':
            default:
                const oscBeep = ctx.createOscillator();
                oscBeep.type = 'square';
                oscBeep.frequency.setValueAtTime(800, ctx.currentTime);
                oscBeep.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscBeep.connect(gainNode);
                oscBeep.start(ctx.currentTime);
                oscBeep.stop(ctx.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.warn("Audio playback failed", e);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      setJoinError('');
      requestNotificationPermission();
      
      try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
      } catch (err) {}

      try {
        const { visitor, queueData: updatedQueueData } = await queueService.joinQueue(queueId, joinName, joinPhone);
        if (!visitor) throw new Error("Server returned no ticket.");
        
        if (updatedQueueData) {
            setQueueData(updatedQueueData);
        }
        
        setMyVisitorId(visitor.id);
        setMyVisitor(visitor);
        localStorage.setItem(`qblink_visit_${queueId}`, visitor.id);
      } catch (e: any) {
        setJoinError(e.message || "Failed to join. Please try again.");
      }
  };

  const handleLeave = async () => {
      if (confirm("Are you sure you want to leave the queue?")) {
          if (myVisitorId) {
              await queueService.leaveQueue(queueId, myVisitorId);
              localStorage.removeItem(`qblink_visit_${queueId}`);
              setMyVisitorId(null);
              setMyVisitor(null);
              setAlertShown(false);
              stopAlertLoop();
              setIsAlerting(false);
          }
      }
  };
  
  const handleRejoin = () => {
      localStorage.removeItem(`qblink_visit_${queueId}`);
      setMyVisitorId(null);
      setMyVisitor(null);
      setJoinName('');
      setJoinPhone('');
      setAlertShown(false);
      stopAlertLoop();
      setIsAlerting(false);
  };

  const handleImComing = () => {
      if (myVisitorId) {
          queueService.dismissAlert(queueId, myVisitorId);
          socketService.emit('customer_ack', { queueId, visitorId: myVisitorId });
          setIsAlerting(false);
          stopAlertLoop();
          stopTitleBlink();
      }
  };

  if (!queueData || !queueInfo) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-sans">Loading Queue...</div>;

  // 1. Not Joined View
  if (!myVisitorId || !myVisitor) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans selection:bg-primary-100">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[40px] shadow-xl shadow-blue-900/5 p-8 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="text-center mb-8 relative z-10">
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary-600 shadow-inner">
                          {queueInfo.logo ? (
                              <img src={queueInfo.logo} alt="Logo" className="w-full h-full object-cover rounded-3xl" />
                          ) : (
                              <Users size={40} />
                          )}
                      </div>
                      <h1 className="text-3xl font-black text-gray-900 tracking-tight">{queueInfo.name}</h1>
                      <p className="text-gray-500 mt-2 font-medium">Join the line effortlessly.</p>
                  </div>

                  {queueInfo.isPaused ? (
                       <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center relative z-10">
                           <PauseCircle size={48} className="text-red-500 mx-auto mb-4" />
                           <h3 className="text-xl font-bold text-red-700 mb-2">Queue Paused</h3>
                           <p className="text-sm text-red-600 leading-relaxed">The queue is currently taking a break. Please check back shortly.</p>
                       </div>
                  ) : (
                      <form onSubmit={handleJoin} className="relative z-10 space-y-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                              <input 
                                required
                                type="text" 
                                placeholder="Enter your name" 
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all text-lg font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                style={{ fontSize: '16px' }} // Prevent iOS zoom
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                              <div className="relative">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input 
                                    type="tel" 
                                    placeholder="For alerts & no-duplicates" 
                                    value={joinPhone}
                                    onChange={(e) => setJoinPhone(e.target.value)}
                                    className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all text-lg font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                                    style={{ fontSize: '16px' }}
                                  />
                              </div>
                          </div>
                          
                          {joinError && (
                              <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center">
                                  {joinError}
                              </div>
                          )}

                          <motion.button 
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            className="w-full py-5 bg-primary-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 mt-2"
                          >
                              Get Ticket <Zap size={20} fill="currentColor" />
                          </motion.button>
                      </form>
                  )}
                  <div className="mt-8 flex justify-center items-center gap-2 text-gray-400 opacity-60">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Powered by Qblink</p>
                  </div>
              </motion.div>
          </div>
      );
  }

  // 2. Served / Cancelled View (Rejoin Logic)
  if (myVisitor.status === 'served' || myVisitor.status === 'cancelled') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-[40px] shadow-xl p-8 text-center"
              >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${myVisitor.status === 'served' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {myVisitor.status === 'served' ? <CheckCircle size={48} /> : <LogOut size={48} />}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">
                      {myVisitor.status === 'served' ? 'You have been served!' : 'You left the queue'}
                  </h2>
                  <p className="text-gray-500 mb-8 font-medium">
                      {myVisitor.status === 'served' ? 'Thanks for visiting. Have a great day!' : 'We hope to see you again soon.'}
                  </p>
                  
                  <button 
                      onClick={handleRejoin}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                  >
                      <RotateCcw size={20} /> Join Again
                  </button>
              </motion.div>
          </div>
      );
  }

  // 3. Active Queue View
  const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length;
  const waitTime = Math.max(1, peopleAhead * queueData.metrics.avgWaitTime);
  const isOnTime = myVisitor.status === 'serving' || (peopleAhead === 0 && myVisitor.status === 'waiting');

  return (
    <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 flex flex-col relative overflow-hidden selection:bg-primary-100"
    >
        {/* Pull to Refresh Indicator */}
        <motion.div 
            style={{ height: pullY }}
            className="w-full flex items-end justify-center overflow-hidden bg-gray-100"
        >
            <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm font-bold">
                <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />
                {isRefreshing ? 'Updating...' : 'Pull to Refresh'}
            </div>
        </motion.div>

        {/* Announcement Banner */}
        <AnimatePresence>
            {queueInfo?.announcement && (
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-orange-500 text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-sm relative z-50 shrink-0"
                >
                    <Megaphone size={16} className="fill-white/20" />
                    {queueInfo.announcement}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 px-4 py-6 flex flex-col items-center justify-start space-y-6 overflow-y-auto no-scrollbar">
            
            {/* Header */}
            <div className="text-center w-full max-w-sm">
                 <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                    <MapPin size={12} /> {queueInfo?.name || 'Queue'}
                 </div>
                 <h1 className="text-2xl font-black text-gray-900">{myVisitor.name}</h1>
            </div>

            {/* Ticket Card (Hero) */}
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs bg-white rounded-[40px] p-8 pb-10 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-blue-900/10 border border-white"
            >
                {/* Decorative Elements */}
                <div className={`absolute top-0 left-0 right-0 h-3 ${isOnTime ? 'bg-green-500' : 'bg-primary-500'}`}></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

                <span className="text-gray-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-4 mt-2">Your Number</span>
                
                <div className="relative">
                    <div className="text-[100px] leading-none font-black text-gray-900 tracking-tighter z-10 relative">
                        {myVisitor.ticketNumber}
                    </div>
                    {/* Shadow for depth */}
                    <div className="absolute top-4 left-0 w-full text-[100px] leading-none font-black text-black opacity-5 blur-sm tracking-tighter z-0 select-none">
                        {myVisitor.ticketNumber}
                    </div>
                </div>
                
                <div className="mt-8 w-full">
                    <motion.div 
                        animate={isOnTime ? { scale: [1, 1.02, 1], boxShadow: ["0 0 0px rgba(34,197,94,0)", "0 0 20px rgba(34,197,94,0.3)", "0 0 0px rgba(34,197,94,0)"] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-bold shadow-sm border transition-colors ${
                            myVisitor.status === 'serving' 
                            ? 'bg-green-500 text-white border-green-500 shadow-green-500/30' 
                            : isOnTime 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}
                    >
                        {myVisitor.status === 'serving' ? (
                            <> <CheckCircle size={18} /> IT'S YOUR TURN </>
                        ) : isOnTime ? (
                            <> <Zap size={18} fill="currentColor" /> GET READY </>
                        ) : (
                            <> <Clock size={18} /> WAITING </>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Est. Wait</span>
                    <span className="text-2xl font-black text-gray-900 flex items-baseline gap-0.5">
                        {waitTime}<span className="text-sm font-bold text-gray-400">m</span>
                    </span>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Ahead</span>
                    <span className="text-2xl font-black text-gray-900">{peopleAhead}</span>
                </div>
            </div>
        </div>

        {/* ALERT OVERLAY (I'm Coming) */}
        <AnimatePresence>
            {isAlerting && (
                <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-[60] bg-primary-600 flex flex-col items-center justify-center p-8 text-center"
                >
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                    >
                        <Bell size={56} className="text-primary-600" fill="currentColor" />
                    </motion.div>
                    
                    <h2 className="text-4xl font-black text-white mb-4 leading-tight">It's Your Turn!</h2>
                    <p className="text-blue-100 text-lg mb-12 max-w-xs font-medium leading-relaxed">
                        Please proceed to the counter immediately.
                    </p>
                    
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={handleImComing}
                        className="w-full max-w-xs py-5 bg-white text-primary-600 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 min-h-[64px]"
                    >
                        <CheckCircle size={24} fill="currentColor" className="text-primary-600" /> I'M COMING
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Pop-up Notification for "2 Ahead" */}
        <AnimatePresence>
            {showNotificationPopup && !isAlerting && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-28 left-4 right-4 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-40 border border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500 rounded-xl text-black">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Almost there!</p>
                            <p className="text-xs text-gray-400">Only 2 people ahead of you.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowNotificationPopup(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors">
                        OK
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="p-6 pt-2 pb-8 z-10 shrink-0">
            <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleLeave}
                className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm min-h-[56px]"
            >
                <LogOut size={18} /> Leave Queue
            </motion.button>
        </div>
    </div>
  );
};

export default CustomerView;
