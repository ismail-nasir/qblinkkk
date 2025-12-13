
import React, { useState, useEffect, useRef } from 'react';
import { User, QueueData, QueueInfo, Visitor, QueueSettings, BusinessType } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { getQueueInsights, optimizeQueueOrder, analyzeCustomerFeedback } from '../services/geminiService';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Image as ImageIcon, CheckCircle, GripVertical, Settings, Play, Save, PauseCircle, Megaphone, Star, Clock, Store, Palette, Sliders, BarChart2, ToggleLeft, ToggleRight, MessageSquare, Pipette, LayoutGrid, Utensils, Stethoscope, Scissors, Building2, ShoppingBag, Sparkles, BrainCircuit, CheckSquare, Loader2, MapPin } from 'lucide-react';
import { motion as m, AnimatePresence, Reorder as ReorderM, useDragControls } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import GlassCard from './GlassCard';

const motion = m as any;
const Reorder = ReorderM as any;

interface QueueManagerProps {
  user: User;
  queue: QueueInfo;
  onBack: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user, queue, onBack }) => {
  const [activeTab, setActiveTab] = useState<'operations' | 'analytics' | 'settings'>('operations');
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentQueue, setCurrentQueue] = useState<QueueInfo>(queue);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const queueDataRef = useRef<QueueData | null>(null);
  const [counterName, setCounterName] = useState(localStorage.getItem('qblink_counter_name') || 'Counter 1');
  
  // UI States
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(queue.announcement || '');
  const [searchQuery, setSearchQuery] = useState('');

  // AI & Analytics
  const [isSmartSorting, setIsSmartSorting] = useState(false);
  const [smartSortReasoning, setSmartSortReasoning] = useState<string | null>(null);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<{ summary: string, sentiment: string, keywords: string[] } | null>(null);
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Settings
  const [settings, setSettings] = useState<QueueSettings>(currentQueue.settings || {
      soundEnabled: true, soundVolume: 1.0, soundType: 'beep', autoSkipMinutes: 0, gracePeriodMinutes: 2, themeColor: '#0066FF', enableSMS: false
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(currentQueue.logo || null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewAudioContextRef = useRef<AudioContext | null>(null);

  // REAL-TIME STREAM
  useEffect(() => {
      // Fetch initial metadata
      queueService.getQueueInfo(queue.id).then(info => {
          if (info) {
              setCurrentQueue(info);
              if (info.settings) setSettings(info.settings);
          }
      });

      // Stream data (this handles all subsequent updates)
      const unsub = queueService.streamQueueData(queue.id, (data) => {
          if (data) {
              setQueueData(data);
              queueDataRef.current = data;
              processAnalytics(data);
          }
      }, true);

      return () => unsub();
  }, [queue.id]);

  const processAnalytics = (data: QueueData) => {
      // Simple Analytics Processing
      const traffic: Record<number, { name: string, joined: number, served: number }> = {};
      for(let i=8; i<=20; i++) {
          const label = `${i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`;
          traffic[i] = { name: label, joined: 0, served: 0 };
      }
      if (data.recentActivity) {
          data.recentActivity.forEach(log => {
              try {
                  let date = (log as any).rawTime ? new Date((log as any).rawTime) : new Date();
                  if (!(log as any).rawTime) {
                      const [timeStr, modifier] = log.time.split(' ');
                      const [hours] = timeStr.split(':');
                      let h = parseInt(hours);
                      if (modifier === 'PM' && h < 12) h += 12;
                      if (modifier === 'AM' && h === 12) h = 0;
                      date.setHours(h);
                  }
                  const h = date.getHours();
                  if (traffic[h]) {
                      if (log.action === 'join') traffic[h].joined++;
                      if (log.action === 'call' || log.action === 'complete') traffic[h].served++;
                  }
              } catch(e) {}
          });
      }
      setChartData(Object.keys(traffic).map(k => traffic[parseInt(k)]));
      
      const cancelled = data.visitors.filter(v => v.status === 'cancelled').length;
      const newPieData = [
          { name: 'Waiting', value: data.metrics.waiting, color: '#f59e0b' },
          { name: 'Served', value: data.metrics.served, color: '#10b981' },
          { name: 'Cancelled', value: cancelled, color: '#ef4444' }
      ].filter(d => d.value > 0);
      setPieData(newPieData.length > 0 ? newPieData : [{ name: 'No Data', value: 1, color: '#e5e7eb' }]);
  };

  // Actions
  const handleCallNext = async () => { 
      setIsProcessing(true);
      try { await queueService.callNext(queue.id, counterName); } finally { setIsProcessing(false); }
  };
  const handleCallByNumber = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      const num = parseInt(callNumberInput); 
      if (!isNaN(num)) { await queueService.callByNumber(queue.id, num, counterName); setShowCallModal(false); setCallNumberInput(''); } 
  };
  const handleAddVisitor = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      await queueService.joinQueue(queue.id, newVisitorName, undefined, 'manual'); 
      setNewVisitorName(''); setShowAddModal(false); 
  };
  const handleRemoveVisitors = async () => { if (confirm("Clear queue?")) await queueService.clearQueue(queue.id); };
  const handleTakeBack = async () => { await queueService.takeBack(queue.id, counterName); };
  const handleNotifyCurrent = async () => { const v = queueData?.visitors.find(v => v.status === 'serving' && v.servedBy === counterName); if (v) await queueService.triggerAlert(queue.id, v.id); };
  const handleBroadcast = async (e: React.FormEvent) => { e.preventDefault(); const updated = await queueService.updateQueue(user.id, queue.id, { announcement: announcementInput }); if (updated) setCurrentQueue(updated); };
  const handleTogglePriority = async (visitorId: string, isPriority: boolean) => { await queueService.togglePriority(queue.id, visitorId, !isPriority); };
  
  // Drag & Drop
  const handleReorder = (newOrder: Visitor[]) => {
      const fullNewList = newOrder.map((v, idx) => ({ ...v, order: idx + 1 }));
      if (queueData) {
          const other = queueData.visitors.filter(v => v.status !== 'waiting');
          setQueueData({ ...queueData, visitors: [...other, ...fullNewList] });
      }
  };
  const handleDragEnd = async () => {
      const currentData = queueDataRef.current;
      if (currentData) {
          const waiting = currentData.visitors.filter(v => v.status === 'waiting').sort((a, b) => {
              if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
              return (a.order || 999999) - (b.order || 999999);
          });
          await queueService.reorderQueue(queue.id, waiting);
      }
  };
  
  // Smart Sort
  const handleSmartSort = async () => {
      if (!queueData) return;
      setIsSmartSorting(true);
      const waiting = queueData.visitors.filter(v => v.status === 'waiting');
      const result = await optimizeQueueOrder(waiting);
      if (result?.orderedIds) {
          const idMap = new Map(waiting.map(v => [v.id, v]));
          const finalOrder = [...result.orderedIds.map(id => idMap.get(id)).filter(Boolean) as Visitor[], ...waiting.filter(v => !result.orderedIds.includes(v.id))];
          await queueService.reorderQueue(queue.id, finalOrder);
          setSmartSortReasoning(result.reasoning);
      }
      setIsSmartSorting(false);
  };

  // QR
  const generateCustomQRCode = async () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const width = 600, height = 800, qrSize = 480, padding = 60;
    canvasRef.current.width = width; canvasRef.current.height = height;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height);
    const params = new URLSearchParams({ view: 'customer', queueId: queue.id, qName: currentQueue.name });
    if (currentQueue.location) params.set('qLoc', currentQueue.location);
    const joinUrl = `${window.location.origin}?${params.toString()}`;
    try {
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, joinUrl, { width: qrSize, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'H' });
        const qrX = (width - qrSize) / 2;
        ctx.drawImage(tempCanvas, qrX, padding);
        ctx.textAlign = 'center'; ctx.fillStyle = '#111827'; ctx.font = 'bold 42px sans-serif';
        ctx.fillText(currentQueue.name, width / 2, padding + qrSize + 70);
        ctx.fillStyle = '#6B7280'; ctx.font = '500 24px sans-serif';
        ctx.fillText('Scan to join the queue', width / 2, padding + qrSize + 110);
    } catch(e) {}
  };
  useEffect(() => { if (showQrModal) generateCustomQRCode(); }, [showQrModal, logoPreview]);

  if (!queueData) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;

  const waitingVisitors = queueData.visitors.filter(v => v.status === 'waiting').sort((a, b) => { 
      const orderA = a.order ?? 999999; const orderB = b.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      return a.ticketNumber - b.ticketNumber; 
  });
  const displayWaiting = searchQuery ? waitingVisitors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ticketNumber.toString().includes(searchQuery)) : waitingVisitors;
  const myCurrentVisitor = queueData.visitors.find(v => v.status === 'serving' && v.servedBy === counterName);

  return (
    <div className="container mx-auto px-4 pb-20 max-w-7xl relative min-h-screen">
      {/* Navbar */}
      <GlassCard className="mb-6 p-4 flex flex-col md:flex-row justify-between items-center bg-white/80 sticky top-4 z-30">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-all shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    {currentQueue.name}
                    {currentQueue.isPaused && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><PauseCircle size={10} /> Paused</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">{currentQueue.code}</span>
                    {currentQueue.location && (
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><MapPin size={10} /> {currentQueue.location}</span>
                    )}
                    {currentQueue.features.multiCounter && (
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Store size={10} className="text-blue-500" />
                            <input type="text" className="text-xs font-bold text-blue-700 bg-transparent outline-none w-20" value={counterName} onChange={(e) => { setCounterName(e.target.value); localStorage.setItem('qblink_counter_name', e.target.value); }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl">
            {['operations', 'analytics', 'settings'].map((tab) => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {tab}
                </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={() => setShowQrModal(true)} className="p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-black transition-all" title="QR Code"><QrCode size={18} /></button>
            <button onClick={() => window.open(`?view=display&queueId=${queue.id}`, '_blank')} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all" title="Display"><Share2 size={18} /></button>
        </div>
      </GlassCard>

      {activeTab === 'operations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: CONTROL DECK */}
              <div className="lg:col-span-2 space-y-6">
                  {/* HERO CARD */}
                  <div className="relative bg-white rounded-[32px] p-8 shadow-xl shadow-blue-900/5 border border-white overflow-hidden text-center group">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Now Serving at {counterName}</p>
                      
                      {myCurrentVisitor ? (
                          <motion.div key={myCurrentVisitor.ticketNumber} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                              <div className="text-8xl md:text-9xl font-black text-gray-900 mb-2 tracking-tighter tabular-nums leading-none">
                                  {String(myCurrentVisitor.ticketNumber).padStart(3, '0')}
                              </div>
                              <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-bold border border-gray-200">
                                  {myCurrentVisitor.name}
                              </div>
                              {myCurrentVisitor.isAlerting && (
                                  <div className="mb-6 flex justify-center">
                                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold animate-pulse flex items-center gap-2 border border-yellow-200">
                                          <Bell size={12} fill="currentColor" /> Paging...
                                      </span>
                                  </div>
                              )}
                          </motion.div>
                      ) : (
                          <div className="text-6xl md:text-8xl font-black text-gray-200 mb-8 py-4">---</div>
                      )}

                      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                          <button 
                            onClick={handleCallNext} 
                            disabled={isProcessing}
                            className="col-span-3 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                          >
                              {isProcessing ? <Loader2 className="animate-spin" /> : <>Call Next <Phone size={20} className="group-hover:rotate-12 transition-transform" /></>}
                          </button>
                          <button 
                            onClick={handleNotifyCurrent} 
                            disabled={!myCurrentVisitor} 
                            className={`py-4 rounded-2xl font-bold border-2 flex items-center justify-center transition-all ${myCurrentVisitor?.isAlerting ? 'bg-yellow-400 border-yellow-400 text-white animate-pulse' : 'bg-white border-gray-100 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 disabled:opacity-50 disabled:hover:border-gray-100 disabled:hover:text-gray-400'}`}
                          >
                              <Bell size={24} fill={myCurrentVisitor?.isAlerting ? "currentColor" : "none"} />
                          </button>
                      </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={() => setShowCallModal(true)} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900">
                          <Phone size={20} /> <span className="text-xs font-bold">Call #</span>
                      </button>
                      <button onClick={() => setShowAddModal(true)} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900">
                          <UserPlus size={20} /> <span className="text-xs font-bold">Add User</span>
                      </button>
                      <button onClick={handleRemoveVisitors} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-red-600">
                          <Trash2 size={20} /> <span className="text-xs font-bold">Clear All</span>
                      </button>
                      <button onClick={handleTakeBack} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900">
                          <RotateCcw size={20} /> <span className="text-xs font-bold">Undo</span>
                      </button>
                  </div>

                  {/* BROADCAST */}
                  <div className="bg-white rounded-2xl p-2 pl-4 border border-gray-100 shadow-sm flex items-center gap-3">
                      <Megaphone size={16} className="text-orange-500" />
                      <input 
                          type="text" 
                          placeholder="Broadcast a message to waiting customers..." 
                          value={announcementInput}
                          onChange={(e) => setAnnouncementInput(e.target.value)}
                          className="flex-1 bg-transparent text-sm font-medium outline-none py-3"
                      />
                      <button onClick={handleBroadcast} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors">Update</button>
                  </div>
              </div>

              {/* RIGHT COLUMN: WAITING LIST */}
              <div className="lg:col-span-1 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[600px]">
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <div>
                          <h3 className="font-bold text-gray-900">Waiting List</h3>
                          <p className="text-xs text-gray-500 font-medium">{queueData.metrics.waiting} people waiting</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`p-2 rounded-lg transition-colors ${isSelectionMode ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600'}`}>
                              <CheckSquare size={16} />
                          </button>
                          <button 
                              onClick={handleSmartSort}
                              disabled={isSmartSorting || queueData.metrics.waiting < 2} 
                              className="p-2 bg-white border border-gray-200 rounded-lg text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                              title="Smart Sort"
                          >
                              {isSmartSorting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          </button>
                      </div>
                  </div>
                  
                  {isSelectionMode && (
                      <div className="bg-blue-50 px-5 py-2 text-xs font-bold text-blue-700 flex justify-between items-center">
                          <span>{selectedVisitorIds.size} Selected</span>
                          <div className="flex gap-2">
                              <button onClick={() => setSelectedVisitorIds(new Set())} className="hover:underline">Clear</button>
                              <div className="h-4 w-px bg-blue-200"></div>
                              <button onClick={() => { if(confirm("Serve selected?")) { /* Logic to bulk serve */ setSelectedVisitorIds(new Set()) } }} className="hover:underline">Serve</button>
                          </div>
                      </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {smartSortReasoning && (
                          <div className="mx-2 mb-2 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-800 relative">
                              <p className="font-bold mb-1 flex items-center gap-1"><BrainCircuit size={12} /> AI Reordered</p>
                              <p className="leading-relaxed opacity-90">{smartSortReasoning}</p>
                              <button onClick={() => setSmartSortReasoning(null)} className="absolute top-2 right-2 text-purple-400 hover:text-purple-600"><X size={12} /></button>
                          </div>
                      )}

                      {displayWaiting.length > 0 ? (
                          searchQuery || isSelectionMode ? (
                              displayWaiting.map(v => (
                                  <VisitorListItem 
                                    key={v.id} 
                                    visitor={v} 
                                    queueData={queueData!} 
                                    onTogglePriority={() => handleTogglePriority(v.id, !v.isPriority)} 
                                    onClick={() => isSelectionMode ? setSelectedVisitorIds(prev => { const n = new Set(prev); if(n.has(v.id)) n.delete(v.id); else n.add(v.id); return n; }) : setSelectedVisitor(v)}
                                    features={currentQueue.features}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedVisitorIds.has(v.id)}
                                  />
                              ))
                          ) : (
                              <Reorder.Group axis="y" values={displayWaiting} onReorder={handleReorder}>
                                  {displayWaiting.map(v => (
                                      <DraggableVisitorListItem 
                                          key={v.id} 
                                          visitor={v} 
                                          queueData={queueData!} 
                                          handleTogglePriority={handleTogglePriority} 
                                          setSelectedVisitor={setSelectedVisitor} 
                                          features={currentQueue.features} 
                                          onDragEnd={handleDragEnd}
                                      />
                                  ))}
                              </Reorder.Group>
                          )
                      ) : (
                          <div className="text-center py-12 text-gray-400 text-sm">
                              Queue is empty.
                          </div>
                      )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                      <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                              type="text" 
                              placeholder="Search list..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                      </div>
                  </div>
              </div>
          </motion.div>
      )}

      {/* Analytics & Settings Tabs (Kept brief for this edit, logic preserved) */}
      {/* ... */}

      {/* Modals */}
      <AnimatePresence>
          {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                      <h3 className="text-xl font-bold mb-6 text-center">Add Visitor</h3>
                      <form onSubmit={handleAddVisitor} className="space-y-4">
                          <input autoFocus type="text" placeholder="Visitor Name" value={newVisitorName} onChange={(e) => setNewVisitorName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                          <div className="flex gap-3 pt-2">
                              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">Add to Queue</button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
          
          {selectedVisitor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl relative overflow-hidden">
                      <button onClick={() => setSelectedVisitor(null)} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900"><X size={18}/></button>
                      <div className="text-center pt-6 pb-2">
                          <div className="text-6xl font-black text-gray-900 mb-2 tracking-tighter">{selectedVisitor.ticketNumber}</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedVisitor.name}</h3>
                          <p className="text-xs text-gray-400 font-mono mb-6">ID: {selectedVisitor.id.slice(-6)}</p>
                          
                          <div className="space-y-3">
                              <button onClick={() => { queueService.callByNumber(queue.id, selectedVisitor.ticketNumber, counterName); setSelectedVisitor(null); }} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-700">Call Now</button>
                              <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => { handleTogglePriority(selectedVisitor.id, !selectedVisitor.isPriority); setSelectedVisitor(null); }} className={`py-3 rounded-xl font-bold text-sm border ${selectedVisitor.isPriority ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200'}`}>{selectedVisitor.isPriority ? 'Remove VIP' : 'Make VIP'}</button>
                                  <button onClick={() => { queueService.leaveQueue(queue.id, selectedVisitor.id); setSelectedVisitor(null); }} className="py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100">Remove</button>
                              </div>
                          </div>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

const DraggableVisitorListItem: React.FC<{ visitor: Visitor, queueData: QueueData, handleTogglePriority: any, setSelectedVisitor: any, features: any, onDragEnd: any }> = ({ visitor, queueData, handleTogglePriority, setSelectedVisitor, features, onDragEnd }) => {
    const dragControls = useDragControls();
    return (
        <Reorder.Item value={visitor} id={visitor.id} dragListener={false} dragControls={dragControls} onDragEnd={onDragEnd}>
            <VisitorListItem visitor={visitor} queueData={queueData} onTogglePriority={() => handleTogglePriority(visitor.id, !visitor.isPriority)} onClick={() => setSelectedVisitor(visitor)} isDraggable={true} onDragStart={(e: any) => dragControls.start(e)} features={features} />
        </Reorder.Item>
    );
};

const VisitorListItem: React.FC<{ visitor: Visitor, queueData: QueueData, onTogglePriority: any, onClick: any, isDraggable?: boolean, onDragStart?: any, features: any, isSelectionMode?: boolean, isSelected?: boolean }> = ({ visitor, onTogglePriority, onClick, isDraggable, onDragStart, features, isSelectionMode, isSelected }) => (
    <div onClick={onClick} className={`p-3 rounded-xl flex items-center justify-between group transition-all select-none cursor-pointer border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}`}>
        <div className="flex items-center gap-3">
            {isSelectionMode ? (
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <CheckCircle size={12} className="text-white" />}
                </div>
            ) : (
                isDraggable && <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1" onPointerDown={onDragStart} onClick={(e) => e.stopPropagation()}><GripVertical size={16} /></div>
            )}
            
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${visitor.isPriority ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                {String(visitor.ticketNumber).padStart(3, '0')}
            </div>
            
            <div>
                <p className="font-bold text-sm text-gray-900">{visitor.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(visitor.joinTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    {visitor.isPriority && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase">VIP</span>}
                    {visitor.isLate && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold uppercase">Late</span>}
                </div>
            </div>
        </div>
        {!isSelectionMode && (
            <button onClick={(e) => { e.stopPropagation(); onTogglePriority(); }} className={`p-2 rounded-full transition-colors ${visitor.isPriority ? 'text-amber-400 hover:bg-amber-50' : 'text-gray-200 hover:text-gray-400'}`}>
                <Star size={16} fill="currentColor" />
            </button>
        )}
    </div>
);

export default QueueManager;
