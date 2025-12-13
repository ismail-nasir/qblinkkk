import React, { useState, useEffect, useRef } from 'react';
import { QueueData, QueueInfo, Visitor } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { LogOut, Zap, Users, Bell, CheckCircle, Megaphone, PauseCircle, RefreshCw, Clock, MapPin, Phone, RotateCcw, AlertTriangle, AlertCircle, Star } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const motion = m as any;

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [myVisitor, setMyVisitor] = useState<Visitor | null>(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Feedback State
  const [rating, setRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // --- 1. INITIALIZATION & STREAMING ---
  useEffect(() => {
    let unsubscribe: () => void;

    const initQueue = async () => {
        try {
            setLoading(true);
            setError(null);

            // Step A: Check if queue exists
            const info = await queueService.getQueueInfo(queueId);
            if (!info) {
                throw new Error("Queue not found. Please check the link or QR code.");
            }
            setQueueInfo(info);

            // Step B: Start Real-time Stream
            unsubscribe = queueService.streamQueueData(queueId, (data, err) => {
                if (err) {
                    console.error("Stream Error:", err);
                    // Only set main error if we have NO data yet
                    if (!queueData) setError(err); 
                } else if (data) {
                    setQueueData(data);
                    // Clear error if we successfully got data
                    setError(null);
                }
                // Always stop loading once we get a response (error or data)
                setLoading(false);
            });

        } catch (e: any) {
            console.error("Init Error:", e);
            setError(e.message || "Unable to load queue.");
            setLoading(false);
        }
    };

    initQueue();

    return () => {
        if (unsubscribe) unsubscribe();
        socketService.off('alert:ack');
        stopAlertLoop();
        stopTitleBlink();
    };
  }, [queueId]);

  // --- 2. LOCAL USER LOGIC ---
  useEffect(() => {
    if (loading) return; // Wait for data

    if (myVisitorId && queueData) {
        const visitor = queueData.visitors.find(v => v.id === myVisitorId);
        
        if (visitor) {
            setMyVisitor(visitor);
            
            // Restore feedback state if already rated
            if (visitor.rating && visitor.rating > 0) {
                setFeedbackSubmitted(true);
                setRating(visitor.rating);
            }

            // Alert Logic
            if (visitor.isAlerting && !isAlerting) {
                 setIsAlerting(true);
                 startAlertLoop();
                 startTitleBlink("🔔 YOUR TURN!");
            } else if (!visitor.isAlerting && isAlerting) {
                 setIsAlerting(false);
                 stopAlertLoop();
                 stopTitleBlink();
            }
            
            // Proximity Alert
            const peopleAhead = queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < visitor.ticketNumber).length;
            if (peopleAhead <= 2 && peopleAhead > 0 && !alertShown && visitor.status === 'waiting') {
                setShowNotificationPopup(true);
                setAlertShown(true);
                sendNotification("Get Ready!", `Only ${peopleAhead} people ahead of you.`);
            }
            
            // Title Updates
            if (!visitor.isAlerting) {
                if (visitor.status === 'waiting') {
                    document.title = `(${peopleAhead + 1}) Position - Qblink`;
                } else {
                    document.title = "Qblink";
                }
            }
        } else {
             // Visitor ID in local storage is no longer in DB (Removed by Admin)
             // Force logout
             setMyVisitorId(null);
             setMyVisitor(null);
             localStorage.removeItem(`qblink_visit_${queueId}`);
        }
    } else {
        document.title = "Join Queue - Qblink";
    }
  }, [queueData, myVisitorId, alertShown, loading, isAlerting]);

  // Countdown Timer Logic
  useEffect(() => {
      if (isAlerting && myVisitor?.calledAt && queueInfo?.settings?.gracePeriodMinutes) {
          const timer = setInterval(() => {
              const callTime = new Date(myVisitor.calledAt!).getTime();
              const graceMs = (queueInfo.settings.gracePeriodMinutes || 2) * 60 * 1000;
              const expireTime = callTime + graceMs;
              const remaining = Math.max(0, Math.ceil((expireTime - Date.now()) / 1000));
              setTimeLeft(remaining);
              if (remaining === 0) clearInterval(timer);
          }, 1000);
          return () => clearInterval(timer);
      } else {
          setTimeLeft(null);
      }
  }, [isAlerting, myVisitor?.calledAt, queueInfo?.settings?.gracePeriodMinutes]);

  const requestNotificationPermission = async () => {
     if ('Notification' in window && Notification.permission === 'default') {
         await Notification.requestPermission();
     }
  };

  const sendNotification = (title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
          if (document.visibilityState === 'hidden' || !document.hasFocus()) {
              try {
                  const notification = new Notification(title, { 
                      body, 
                      icon: '/favicon.ico',
                      tag: 'qblink-update'
                  });
                  notification.onclick = () => { window.focus(); notification.close(); };
              } catch (e) {}
          }
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
          } else {
              setPullY(0);
          }
      }
  };

  const handleTouchEnd = async () => {
      if (pullY > 70) {
          setIsRefreshing(true);
          setPullY(70); 
          setTimeout(() => {
              setIsRefreshing(false);
              setPullY(0);
          }, 500);
      } else {
          setPullY(0);
      }
      pullStartY.current = 0;
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
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 44100});
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      setJoinError('');
      await requestNotificationPermission();
      
      try {
        const { visitor } = await queueService.joinQueue(queueId, joinName, joinPhone);
        if (!visitor) throw new Error("Server returned no ticket.");
        
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
              setFeedbackSubmitted(false);
              setRating(0);
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
      setFeedbackSubmitted(false);
      setRating(0);
  };

  const handleImComing = () => {
      if (myVisitorId) {
          queueService.confirmPresence(queueId, myVisitorId);
          socketService.emit('customer_ack', { queueId, visitorId: myVisitorId });
          setIsAlerting(false);
          stopAlertLoop();
          stopTitleBlink();
      }
  };

  const submitFeedback = async (score: number) => {
      setRating(score);
      setFeedbackSubmitted(true);
      if (myVisitorId) {
          await queueService.submitFeedback(queueId, myVisitorId, score);
      }
  };

  const themeColor = queueInfo?.settings?.themeColor || '#0066FF';

  // --- RENDER STATES ---

  // 1. Error State (Blocking)
  if (error) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-red-100">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <AlertCircle size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Queue Not Found</h2>
                  <p className="text-gray-500 text-sm mb-6">{error}</p>
                  <a href="/" className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                      Go Home
                  </a>
              </div>
          </div>
      );
  }

  // 2. Loading State (Only if no data yet)
  if (loading || !queueInfo) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" style={{borderTopColor: themeColor}}></div>
              <p className="text-gray-500 font-medium animate-pulse">Loading Queue...</p>
          </div>
      );
  }

  // 3. Join Form (Not Joined)
  if (!myVisitorId || !myVisitor) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans selection:bg-primary-100">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[40px] shadow-xl shadow-blue-900/5 p-8 relative overflow-hidden"
              >
                  {/* ... Header & Join Form ... */}
                  <div className="text-center mb-8 relative z-10">
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary-600 shadow-inner overflow-hidden">
                          {queueInfo.logo ? <img src={queueInfo.logo} className="w-full h-full object-cover" /> : <Users size={40} style={{color: themeColor}} />}
                      </div>
                      <h1 className="text-3xl font-black text-gray-900 tracking-tight">{queueInfo.name}</h1>
                      <p className="text-gray-500 mt-2 font-medium">Join the line effortlessly.</p>
                  </div>

                  {queueInfo.isPaused ? (
                       <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center relative z-10">
                           <PauseCircle size={48} className="text-red-500 mx-auto mb-4" />
                           <h3 className="text-xl font-bold text-red-700 mb-2">Queue Paused</h3>
                           <p className="text-sm text-red-600 leading-relaxed">The queue is currently taking a break.</p>
                       </div>
                  ) : (
                      <form onSubmit={handleJoin} className="relative z-10 space-y-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                              <input required type="text" placeholder="Enter your name" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-gray-300 transition-all text-lg font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400 appearance-none" style={{ fontSize: '16px' }} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                              <div className="relative">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                  <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="Required for updates" value={joinPhone} onChange={(e) => setJoinPhone(e.target.value)} className="w-full pl-12 p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-gray-300 transition-all text-lg font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400 appearance-none" style={{ fontSize: '16px' }} required />
                              </div>
                          </div>
                          {joinError && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2"><AlertCircle size={16} /> {joinError}</div>}
                          <motion.button whileTap={{ scale: 0.98 }} type="submit" style={{ backgroundColor: themeColor }} className="w-full py-5 text-white rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 hover:opacity-90 active:scale-95">Get Ticket <Zap size={20} fill="currentColor" /></motion.button>
                      </form>
                  )}
                  <div className="mt-8 flex justify-center items-center gap-2 text-gray-400 opacity-60"><p className="text-[10px] font-bold uppercase tracking-widest">Powered by Qblink</p></div>
              </motion.div>
          </div>
      );
  }

  // 4. Served / Cancelled View
  if (myVisitor.status === 'served' || myVisitor.status === 'cancelled') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-xl p-8 text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${myVisitor.status === 'served' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {myVisitor.status === 'served' ? <CheckCircle size={48} /> : <LogOut size={48} />}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">{myVisitor.status === 'served' ? 'You have been served!' : 'You left the queue'}</h2>
                  <p className="text-gray-500 mb-8 font-medium">{myVisitor.status === 'served' ? 'Thanks for visiting. How was your experience?' : 'We hope to see you again soon.'}</p>
                  
                  {myVisitor.status === 'served' && (
                      <div className="mb-8">
                          <div className="flex justify-center gap-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <motion.button key={star} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => !feedbackSubmitted && submitFeedback(star)} className={`p-2 transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`} disabled={feedbackSubmitted}><Star size={32} fill="currentColor" /></motion.button>
                              ))}
                          </div>
                          {feedbackSubmitted && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 font-bold text-sm">Thank you for your feedback!</motion.div>}
                      </div>
                  )}
                  <button onClick={handleRejoin} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"><RotateCcw size={20} /> Join Again</button>
              </motion.div>
          </div>
      );
  }

  // 5. Active Queue View
  const peopleAhead = queueData ? queueData.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length : 0;
  const waitTime = Math.max(1, peopleAhead * (queueData?.metrics.avgWaitTime || 5));
  const isOnTime = myVisitor.status === 'serving' || (peopleAhead === 0 && myVisitor.status === 'waiting');

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 flex flex-col relative overflow-hidden selection:bg-primary-100">
        <motion.div style={{ height: pullY }} className="w-full flex items-end justify-center overflow-hidden bg-gray-100">
            <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm font-bold"><RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />{isRefreshing ? 'Updating...' : 'Pull to Refresh'}</div>
        </motion.div>

        <AnimatePresence>
            {queueInfo?.announcement && (
                <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-sm relative z-50 shrink-0" style={{ backgroundColor: themeColor }}>
                    <Megaphone size={16} className="fill-white/20" />{queueInfo.announcement}
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex-1 px-4 py-6 flex flex-col items-center justify-start space-y-6 overflow-y-auto no-scrollbar pb-24">
            <div className="text-center w-full max-w-sm">
                 <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-widest mb-1"><MapPin size={12} /> {queueInfo?.name || 'Queue'}</div>
                 <h1 className="text-2xl font-black text-gray-900 break-words">{myVisitor.name}</h1>
            </div>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xs bg-white rounded-[40px] p-8 pb-10 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-blue-900/10 border border-white">
                <div className={`absolute top-0 left-0 right-0 h-3 ${isOnTime ? 'bg-green-500' : ''}`} style={{ backgroundColor: isOnTime ? undefined : themeColor }}></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                <span className="text-gray-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-4 mt-2">Your Number</span>
                <div className="relative">
                    <div className="text-[100px] leading-none font-black text-gray-900 tracking-tighter z-10 relative">{myVisitor.ticketNumber}</div>
                    <div className="absolute top-4 left-0 w-full text-[100px] leading-none font-black text-black opacity-5 blur-sm tracking-tighter z-0 select-none">{myVisitor.ticketNumber}</div>
                </div>
                {myVisitor.isLate && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 w-full bg-red-50 text-red-600 border border-red-100 p-3 rounded-2xl text-center text-xs font-bold leading-relaxed"><div className="flex justify-center mb-1"><AlertTriangle size={20} /></div>You missed your turn and were moved to the back of the queue.</motion.div>}
                <div className="mt-8 w-full">
                    <motion.div animate={isOnTime ? { scale: [1, 1.02, 1], boxShadow: ["0 0 0px rgba(34,197,94,0)", "0 0 20px rgba(34,197,94,0.3)", "0 0 0px rgba(34,197,94,0)"] } : {}} transition={{ repeat: Infinity, duration: 2 }} className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-bold shadow-sm border transition-colors ${myVisitor.status === 'serving' ? 'bg-green-500 text-white border-green-500 shadow-green-500/30' : isOnTime ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {myVisitor.status === 'serving' ? (<><CheckCircle size={18} /> IT'S YOUR TURN </>) : isOnTime ? (<><Zap size={18} fill="currentColor" /> GET READY </>) : (<><Clock size={18} /> WAITING </>)}
                    </motion.div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"><span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Est. Wait</span><span className="text-2xl font-black text-gray-900 flex items-baseline gap-0.5">{waitTime}<span className="text-sm font-bold text-gray-400">m</span></span></div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"><span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Ahead</span><span className="text-2xl font-black text-gray-900">{peopleAhead}</span></div>
            </div>
        </div>

        <AnimatePresence>
            {isAlerting && (
                <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: themeColor }}>
                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"><Bell size={56} style={{ color: themeColor }} fill="currentColor" /></motion.div>
                    <h2 className="text-4xl font-black text-white mb-4 leading-tight">It's Your Turn!</h2>
                    {timeLeft !== null && <div className="mb-8"><span className="text-blue-100 font-bold text-sm uppercase tracking-widest">Confirm in</span><div className="text-6xl font-black text-white font-mono mt-2">{timeLeft}s</div></div>}
                    <p className="text-white/80 text-lg mb-12 max-w-xs font-medium leading-relaxed">Please confirm you are here, or you will be moved to the back of the queue.</p>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleImComing} className="w-full max-w-xs py-5 bg-white rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 min-h-[64px]" style={{ color: themeColor }}><CheckCircle size={24} fill="currentColor" /> I'M COMING</motion.button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="p-6 pt-2 pb-8 z-10 shrink-0">
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleLeave} className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm min-h-[56px]"><LogOut size={18} /> Leave Queue</motion.button>
        </div>
    </div>
  );
};

export default CustomerView;