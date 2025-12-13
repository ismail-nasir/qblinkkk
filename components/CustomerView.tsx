
import React, { useState, useEffect, useRef } from 'react';
import { QueueData, QueueInfo, Visitor } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { LogOut, Zap, Users, Bell, CheckCircle, Megaphone, PauseCircle, RefreshCw, Clock, MapPin, Phone, RotateCcw, AlertTriangle, AlertCircle, Star, Loader2, Send, WifiOff } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

const motion = m as any;

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [myVisitor, setMyVisitor] = useState<Visitor | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // UI States
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [alertShown, setAlertShown] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Feedback
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Audio/Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<number | null>(null);
  const titleIntervalRef = useRef<number | null>(null);

  const emojis = [
      { id: 1, icon: '😡' },
      { id: 2, icon: '☹️' },
      { id: 3, icon: '😐' },
      { id: 4, icon: '🙂' },
      { id: 5, icon: '😍' },
  ];

  // Initialize
  useEffect(() => {
        const init = async () => {
            try {
                const info = await queueService.getQueueInfo(queueId);
                if (info) {
                    setQueueInfo(info);
                } else {
                    // Demo Fallback
                    const params = new URLSearchParams(window.location.search);
                    const qName = params.get('qName') || "Demo Queue";
                    await queueService.hydrateQueue(queueId, qName);
                    const updated = await queueService.getQueueInfo(queueId);
                    if(updated) setQueueInfo(updated);
                    setIsDemoMode(true);
                }

                // Stream Data
                queueService.streamQueueData(queueId, (data, err) => {
                    if (data) {
                        setQueueData(data);
                        setLoading(false);
                    } else if (err && !queueData) {
                        setError(err);
                    }
                }, false);
            } catch (e: any) {
                setError(e.message || "Failed to load queue");
                setLoading(false);
            }
        };
        init();
        socketService.joinQueue(queueId);
        
        window.addEventListener('online', () => setIsOffline(false));
        window.addEventListener('offline', () => setIsOffline(true));
        
        return () => {
            stopAlertLoop();
            if(titleIntervalRef.current) clearInterval(titleIntervalRef.current);
        };
  }, [queueId]);

  // Logic Updates
  useEffect(() => {
      if (myVisitorId && queueData) {
          const visitor = queueData.visitors.find(v => v.id === myVisitorId);
          if (visitor) {
              setMyVisitor(visitor);
              if (visitor.rating && visitor.rating > 0) {
                  setFeedbackSubmitted(true);
                  setRating(visitor.rating);
                  if (visitor.feedback) setFeedbackComment(visitor.feedback);
              }

              // Alert Logic
              if (visitor.isAlerting && !isAlerting) {
                  setIsAlerting(true);
                  startAlertLoop();
              } else if (!visitor.isAlerting && isAlerting) {
                  setIsAlerting(false);
                  stopAlertLoop();
              }

              // Countdown
              if (visitor.isAlerting && visitor.calledAt) {
                  const callTime = new Date(visitor.calledAt).getTime();
                  const graceMs = (queueInfo?.settings.gracePeriodMinutes || 2) * 60 * 1000;
                  const remaining = Math.max(0, Math.ceil((callTime + graceMs - Date.now()) / 1000));
                  setTimeLeft(remaining);
              }
          } else if (!loading) {
              // Removed from queue
              setMyVisitorId(null);
              setMyVisitor(null);
              localStorage.removeItem(`qblink_visit_${queueId}`);
          }
      }
  }, [queueData, myVisitorId, queueInfo]);

  // Alert Loop
  const startAlertLoop = () => {
      playBeep();
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = window.setInterval(playBeep, 2000);
      
      if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
      let visible = true;
      titleIntervalRef.current = window.setInterval(() => {
          document.title = visible ? "🔔 YOUR TURN!" : "🔴 🔴 🔴";
          visible = !visible;
      }, 1000);
  };

  const stopAlertLoop = () => {
      if (alertIntervalRef.current) { clearInterval(alertIntervalRef.current); alertIntervalRef.current = null; }
      if (titleIntervalRef.current) { clearInterval(titleIntervalRef.current); titleIntervalRef.current = null; document.title = "Qblink"; }
  };

  const playBeep = () => {
      if (queueInfo?.settings?.soundEnabled === false) return;
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(); osc.stop(ctx.currentTime + 0.5);
      } catch(e) {}
  };

  // Actions
  const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsJoining(true);
      try {
          const { visitor } = await queueService.joinQueue(queueId, joinName, joinPhone);
          if (visitor) {
              setMyVisitor(visitor);
              setMyVisitorId(visitor.id);
              localStorage.setItem(`qblink_visit_${queueId}`, visitor.id);
          }
      } catch(e: any) { setJoinError(e.message); } finally { setIsJoining(false); }
  };

  const handleLeave = async () => {
      if (confirm("Leave queue?")) {
          await queueService.leaveQueue(queueId, myVisitorId!);
          localStorage.removeItem(`qblink_visit_${queueId}`);
          setMyVisitorId(null); setMyVisitor(null);
      }
  };

  const handleSubmitFeedback = async () => {
      if(myVisitorId && rating > 0) {
          setFeedbackSubmitted(true);
          await queueService.submitFeedback(queueId, myVisitorId, rating, feedbackComment);
      }
  };

  // --- RENDER ---
  if (loading || !queueInfo) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (error) return <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">{error}</div>;

  const themeColor = queueInfo.settings.themeColor || '#0066FF';

  // 1. JOIN VIEW
  if (!myVisitor || !myVisitorId) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans selection:bg-blue-100">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-md rounded-[40px] shadow-xl p-8 relative overflow-hidden">
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-blue-600">
                          {queueInfo.logo ? <img src={queueInfo.logo} className="w-full h-full object-cover rounded-3xl" /> : <Users size={32} style={{color: themeColor}} />}
                      </div>
                      <h1 className="text-3xl font-black text-gray-900 tracking-tight">{queueInfo.name}</h1>
                      <p className="text-gray-500 mt-2 font-medium">Join the line effortlessly.</p>
                  </div>
                  
                  <form onSubmit={handleJoin} className="space-y-4 relative z-10">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                          <input required type="text" placeholder="Enter your name" value={joinName} onChange={e => setJoinName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:outline-none transition-all font-bold text-lg" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone (Optional)</label>
                          <input type="tel" placeholder="For notifications" value={joinPhone} onChange={e => setJoinPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:outline-none transition-all font-bold text-lg" />
                      </div>
                      {joinError && <p className="text-red-500 text-sm font-bold text-center">{joinError}</p>}
                      <button disabled={isJoining} type="submit" style={{backgroundColor: themeColor}} className="w-full py-5 text-white rounded-2xl font-bold text-xl shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                          {isJoining ? <Loader2 className="animate-spin" /> : 'Get Ticket'}
                      </button>
                  </form>
              </motion.div>
          </div>
      );
  }

  // 2. SERVED/CANCELLED VIEW
  if (myVisitor.status === 'served' || myVisitor.status === 'cancelled') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-xl p-8 text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${myVisitor.status === 'served' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {myVisitor.status === 'served' ? <CheckCircle size={48} /> : <LogOut size={48} />}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">{myVisitor.status === 'served' ? 'You were served!' : 'You left the queue'}</h2>
                  <p className="text-gray-500 mb-8 font-medium">We hope to see you again soon.</p>
                  
                  {myVisitor.status === 'served' && (
                      <div className="mb-8 bg-gray-50 p-6 rounded-3xl">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">How was your experience?</p>
                          <div className="flex justify-center gap-2 mb-4">
                              {emojis.map((emoji) => (
                                  <button key={emoji.id} onClick={() => !feedbackSubmitted && setRating(emoji.id)} className={`text-4xl hover:scale-125 transition-transform ${rating === emoji.id ? 'scale-125 grayscale-0' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`} disabled={feedbackSubmitted}>
                                      {emoji.icon}
                                  </button>
                              ))}
                          </div>
                          {rating > 0 && !feedbackSubmitted && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3">
                                  <textarea placeholder="Tell us more (optional)..." value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} className="w-full p-3 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none" rows={3} />
                                  <button onClick={handleSubmitFeedback} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm">Submit Feedback</button>
                              </motion.div>
                          )}
                          {feedbackSubmitted && <div className="text-green-600 font-bold text-sm">Thanks for your feedback!</div>}
                      </div>
                  )}
                  
                  <button onClick={() => { localStorage.removeItem(`qblink_visit_${queueId}`); setMyVisitorId(null); setMyVisitor(null); setRating(0); setFeedbackSubmitted(false); }} className="w-full py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-50">Join Again</button>
              </motion.div>
          </div>
      );
  }

  // 3. WAITING VIEW (Active)
  const peopleAhead = queueData?.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length || 0;
  const isOnTime = myVisitor.status === 'serving';

  return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans">
          {/* Offline Banner */}
          <AnimatePresence>{isOffline && <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="bg-red-500 text-white px-4 py-2 text-center text-xs font-bold z-50 flex justify-center gap-2"><WifiOff size={14} /> Offline</motion.div>}</AnimatePresence>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center p-6 pt-12 space-y-8">
              <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1"><MapPin size={10} /> {queueInfo.name}</div>
                  <h1 className="text-3xl font-black text-gray-900">{myVisitor.name}</h1>
              </div>

              {/* TICKET CARD */}
              <motion.div layout className="w-full max-w-xs bg-white rounded-[40px] p-8 pb-10 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-blue-900/10 border border-white">
                  <div className={`absolute top-0 left-0 right-0 h-2 ${isOnTime ? 'bg-green-500' : ''}`} style={{backgroundColor: isOnTime ? undefined : themeColor}}></div>
                  <span className="text-gray-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-4 mt-2">Your Number</span>
                  <div className="text-[100px] leading-none font-black text-gray-900 tracking-tighter z-10">{myVisitor.ticketNumber}</div>
                  <div className="absolute top-4 left-0 w-full text-[100px] leading-none font-black text-black opacity-5 blur-sm tracking-tighter z-0 select-none">{myVisitor.ticketNumber}</div>
                  
                  {myVisitor.isLate && <div className="mt-4 bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-100">You missed your turn</div>}

                  <div className="mt-8 w-full">
                      <div className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold border ${isOnTime ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {isOnTime ? <><Zap size={16} fill="currentColor" /> IT'S YOUR TURN</> : <><Clock size={16} /> WAITING</>}
                      </div>
                  </div>
              </motion.div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Est. Wait</span>
                      <span className="text-2xl font-black text-gray-900">{Math.max(1, peopleAhead * (queueData?.metrics.avgWaitTime || 5))}m</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Ahead</span>
                      <span className="text-2xl font-black text-gray-900">{peopleAhead}</span>
                  </div>
              </div>
          </div>

          {/* ALERT OVERLAY */}
          <AnimatePresence>
              {isAlerting && (
                  <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 text-center" style={{backgroundColor: themeColor}}>
                      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                          <Bell size={64} style={{color: themeColor}} fill="currentColor" />
                      </motion.div>
                      <h2 className="text-5xl font-black text-white mb-4 leading-tight">It's Your Turn!</h2>
                      {timeLeft && <div className="text-white/80 font-mono text-xl mb-8">Confirm in {timeLeft}s</div>}
                      <button onClick={() => { queueService.confirmPresence(queueId, myVisitorId!); socketService.emit('customer_ack', { queueId, visitorId: myVisitorId }); setIsAlerting(false); }} className="w-full max-w-xs py-5 bg-white rounded-3xl font-black text-xl shadow-xl text-gray-900 active:scale-95 transition-transform">I'M COMING</button>
                  </motion.div>
              )}
          </AnimatePresence>

          <div className="p-6 pb-8">
              <button onClick={handleLeave} className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50">Leave Queue</button>
          </div>
      </div>
  );
};

export default CustomerView;
