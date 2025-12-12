
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueueData, QueueInfo, Visitor } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { LogOut, Zap, Bell, CheckCircle, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerViewProps {
  queueId: string;
}

const CustomerView: React.FC<CustomerViewProps> = ({ queueId }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [myVisitorId, setMyVisitorId] = useState<string | null>(localStorage.getItem(`qblink_visit_${queueId}`));
  const [myVisitor, setMyVisitor] = useState<Visitor | null>(null);
  
  // Join Form
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fetch Logic
  const fetchData = useCallback(async () => {
      try {
          const info = await queueService.getQueueInfo(queueId);
          if (!info) throw new Error("Queue not found");
          setQueueInfo(info);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  }, [queueId]);

  useEffect(() => {
      fetchData();
      
      // Real-time listener
      const unsub = queueService.streamQueueData(queueId, (data) => {
          setQueueData(data);
      });
      return () => unsub();
  }, [queueId, fetchData]);

  useEffect(() => {
      if (queueData && myVisitorId) {
          const v = queueData.visitors.find(v => v.id === myVisitorId);
          setMyVisitor(v || null);
          
          if (v?.status === 'serving' && v.isAlerting) {
              playAlert();
          }
      }
  }, [queueData, myVisitorId]);

  const playAlert = () => {
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioContextRef.current;
          if (ctx && ctx.state === 'suspended') ctx.resume();
          
          const osc = ctx!.createOscillator();
          const gain = ctx!.createGain();
          osc.connect(gain);
          gain.connect(ctx!.destination);
          
          osc.frequency.setValueAtTime(800, ctx!.currentTime);
          osc.frequency.linearRampToValueAtTime(1200, ctx!.currentTime + 0.1);
          gain.gain.setValueAtTime(0.5, ctx!.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx!.currentTime + 0.5);
          
          osc.start();
          osc.stop(ctx!.currentTime + 0.5);
      } catch (e) {}
  };

  const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinName) return;
      
      try {
          // Init audio context on user gesture
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          const { visitor } = await queueService.joinQueue(queueId, joinName, joinPhone);
          setMyVisitorId(visitor.id);
          localStorage.setItem(`qblink_visit_${queueId}`, visitor.id);
      } catch (e) {
          alert("Failed to join queue.");
      }
  };

  const handleLeave = () => {
      if(confirm("Leave queue?")) {
          if (myVisitorId) queueService.leaveQueue(queueId, myVisitorId);
          setMyVisitorId(null);
          localStorage.removeItem(`qblink_visit_${queueId}`);
      }
  };

  if (error) return <div className="min-h-screen flex items-center justify-center p-4 text-center"><AlertCircle className="w-8 h-8 text-red-500 mb-2" /><p>{error}</p></div>;
  if (loading || !queueInfo) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="animate-spin text-gray-400" /></div>;

  // Not Joined View
  if (!myVisitorId || !myVisitor) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-[40px] shadow-xl p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0"></div>
                  <h1 className="text-3xl font-black text-gray-900 mb-2 relative z-10">{queueInfo.name}</h1>
                  <p className="text-gray-500 mb-8">Join the line remotely.</p>
                  
                  <form onSubmit={handleJoin} className="space-y-4 relative z-10">
                      <input 
                        type="text" 
                        placeholder="Your Name" 
                        value={joinName} 
                        onChange={e => setJoinName(e.target.value)} 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-lg font-bold"
                        required
                      />
                      <input 
                        type="tel" 
                        placeholder="Phone (Optional)" 
                        value={joinPhone} 
                        onChange={e => setJoinPhone(e.target.value)} 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none text-lg font-bold"
                      />
                      <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-700 transition-colors">
                          Get Ticket
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // Active View
  const peopleAhead = queueData?.visitors.filter(v => v.status === 'waiting' && v.ticketNumber < myVisitor.ticketNumber).length || 0;
  const isMyTurn = myVisitor.status === 'serving';

  return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
          {/* Header */}
          <div className="p-6 text-center">
              <h2 className="text-gray-900 font-bold text-xl">{queueInfo.name}</h2>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-1"><MapPin size={12} /> Live Status</p>
          </div>

          {/* Ticket Card */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className={`bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center relative overflow-hidden border-4 ${isMyTurn ? 'border-green-500' : 'border-white'}`}
              >
                  {isMyTurn && <div className="absolute inset-0 bg-green-50/50 animate-pulse pointer-events-none"></div>}
                  
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Ticket</p>
                  <div className="text-8xl font-black text-gray-900 mb-2">{String(myVisitor.ticketNumber).padStart(3, '0')}</div>
                  
                  <div className="my-8">
                      {isMyTurn ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-bold text-lg shadow-lg shadow-green-500/30">
                              <Bell size={20} className="animate-bounce" /> IT'S YOUR TURN!
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-2xl">
                                  <p className="text-xs font-bold text-gray-400 uppercase">Ahead</p>
                                  <p className="text-2xl font-black text-gray-900">{peopleAhead}</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-2xl">
                                  <p className="text-xs font-bold text-gray-400 uppercase">Est. Wait</p>
                                  <p className="text-2xl font-black text-gray-900">{peopleAhead * (queueInfo.estimatedWaitTime || 5)}m</p>
                              </div>
                          </div>
                      )}
                  </div>

                  <p className="text-gray-500 font-medium text-sm">
                      {isMyTurn ? "Please proceed to the counter." : "We'll notify you when you're up."}
                  </p>
              </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6">
              <button onClick={handleLeave} className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl shadow-sm border border-red-100 flex items-center justify-center gap-2">
                  <LogOut size={18} /> Leave Queue
              </button>
          </div>
      </div>
  );
};

export default CustomerView;
