
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, QueueData, QueueInfo, Visitor, QueueSettings, BusinessType } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { getQueueInsights, optimizeQueueOrder, analyzeCustomerFeedback } from '../services/geminiService';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Image as ImageIcon, CheckCircle, GripVertical, Settings, Play, Save, PauseCircle, Megaphone, Star, Clock, Store, Palette, Sliders, BarChart2, ToggleLeft, ToggleRight, MessageSquare, Pipette, LayoutGrid, Utensils, Stethoscope, Scissors, Building2, ShoppingBag, Sparkles, BrainCircuit, ThumbsUp, ThumbsDown, Minus, Quote, Zap, PieChart as PieChartIcon, TrendingUp, MapPin } from 'lucide-react';
import { motion as m, AnimatePresence, Reorder as ReorderM, useDragControls } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

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
  
  // Ref for accessing latest state in event handlers
  const queueDataRef = useRef<QueueData | null>(null);
  
  // Local Config
  const [counterName, setCounterName] = useState(localStorage.getItem('qblink_counter_name') || 'Counter 1');
  
  // Modal States
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  
  // Visitor Detail Modal
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  
  // UI States
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(queue.announcement || '');
  const [searchQuery, setSearchQuery] = useState('');

  // AI States
  const [isSmartSorting, setIsSmartSorting] = useState(false);
  const [smartSortReasoning, setSmartSortReasoning] = useState<string | null>(null);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<{ summary: string, sentiment: string, keywords: string[] } | null>(null);
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<QueueSettings>(currentQueue.settings || {
      soundEnabled: true,
      soundVolume: 1.0,
      soundType: 'beep',
      autoSkipMinutes: 0,
      gracePeriodMinutes: 2,
      themeColor: '#3b82f6',
      enableSMS: false
  });

  // QR Generation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentQueue.logo || null);

  // Audio Context for preview
  const previewAudioContextRef = useRef<AudioContext | null>(null);

  // Analytics Data
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const businessTypes: { type: BusinessType; icon: any; label: string }[] = [
      { type: 'general', icon: LayoutGrid, label: 'General' },
      { type: 'restaurant', icon: Utensils, label: 'Restaurant' },
      { type: 'clinic', icon: Stethoscope, label: 'Clinic' },
      { type: 'salon', icon: Scissors, label: 'Salon' },
      { type: 'bank', icon: Building2, label: 'Bank' },
      { type: 'retail', icon: ShoppingBag, label: 'Retail' },
  ];

  const fetchData = useCallback(async () => {
      try {
          const data = await queueService.getQueueData(queue.id);
          setQueueData(data);
          const info = await queueService.getQueueInfo(queue.id);
          if (info) {
              setCurrentQueue(info);
              if (info.settings) setSettings(info.settings);
          }
          
          // Generate Bar Chart Data from Recent Activity (Hourly)
          const traffic: Record<number, { name: string, joined: number, served: number }> = {};
          
          // Init buckets 8 AM - 8 PM
          for(let i=8; i<=20; i++) {
              const label = `${i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`;
              traffic[i] = { name: label, joined: 0, served: 0 };
          }

          data.recentActivity.forEach(log => {
              let date;
              if ((log as any).rawTime) {
                  date = new Date((log as any).rawTime);
              } else {
                  // Mock data fallback parsing
                  const [timeStr, modifier] = log.time.split(' ');
                  const [hours] = timeStr.split(':');
                  let h = parseInt(hours);
                  if (modifier === 'PM' && h < 12) h += 12;
                  if (modifier === 'AM' && h === 12) h = 0;
                  date = new Date();
                  date.setHours(h);
              }
              
              const h = date.getHours();
              if (traffic[h]) {
                  if (log.action === 'join') traffic[h].joined++;
                  if (log.action === 'call' || log.action === 'complete') traffic[h].served++;
              }
          });
          
          const finalChartData = Object.keys(traffic).map(k => traffic[parseInt(k)]);
          setChartData(finalChartData);

          // Generate Pie Chart Data (Status Distribution)
          const cancelledCount = data.visitors.filter(v => v.status === 'cancelled' || v.status === 'skipped').length;
          const newPieData = [
              { name: 'Waiting', value: data.metrics.waiting, color: '#f59e0b' },
              { name: 'Served', value: data.metrics.served, color: '#10b981' },
              { name: 'Cancelled', value: cancelledCount, color: '#ef4444' }
          ].filter(d => d.value > 0);
          
          setPieData(newPieData.length > 0 ? newPieData : [{ name: 'No Data', value: 1, color: '#e5e7eb' }]);

      } catch (e) {
          console.error("Failed to fetch queue data", e);
      }
  }, [queue.id]);

  useEffect(() => {
    fetchData();
    socketService.joinQueue(queue.id);
    socketService.on('queue:update', () => fetchData());
    socketService.on('customer_response', () => fetchData());
    return () => {
        socketService.off('queue:update');
        socketService.off('customer_response');
    };
  }, [fetchData, queue.id]);

  // Keep Ref in sync
  useEffect(() => {
      queueDataRef.current = queueData;
  }, [queueData]);

  // Dynamic Queue Logic: Grace Period & Auto-Skip Monitor
  useEffect(() => {
      const gracePeriod = settings.gracePeriodMinutes || 2;
      const autoSkip = settings.autoSkipMinutes || 0;

      const interval = setInterval(() => {
          queueService.handleGracePeriodExpiry(queue.id, gracePeriod);
          if (autoSkip > 0) {
              queueService.autoSkipInactive(queue.id, autoSkip);
          }
      }, 5000); 

      return () => clearInterval(interval);
  }, [settings.gracePeriodMinutes, settings.autoSkipMinutes, queue.id]);

  // --- PREDICTIVE ANALYTICS LOGIC ---
  const calculatePredictedWait = () => {
      if (!queueData) return { time: 0, activeStaff: 1 };
      
      const servedVisitors = queueData.visitors.filter(v => v.status === 'served' && v.servedTime && v.servingStartTime);
      
      // If no history, use estimated default
      if (servedVisitors.length < 3) {
          return { 
              time: (currentQueue.estimatedWaitTime || 5) * queueData.metrics.waiting, 
              activeStaff: 1 
          };
      }

      // Sort by most recent
      servedVisitors.sort((a,b) => new Date(b.servedTime!).getTime() - new Date(a.servedTime!).getTime());
      
      // Look at last 10 served for average time
      const recent = servedVisitors.slice(0, 10);

      // Calculate actual duration for each
      const totalDuration = recent.reduce((acc, v) => {
          const start = new Date(v.servingStartTime!).getTime();
          const end = new Date(v.servedTime!).getTime();
          return acc + (end - start);
      }, 0);
      
      const avgServiceTimeMs = totalDuration / recent.length;
      const avgServiceTimeMins = avgServiceTimeMs / 60000;
      
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const activeStaffSet = new Set(
          servedVisitors
            .filter(v => new Date(v.servedTime!).getTime() > oneHourAgo)
            .map(v => v.servedBy)
            .filter(name => name && name !== 'System' && name !== 'Staff')
      );
      
      const activeCounters = activeStaffSet.size > 0 ? activeStaffSet.size : (new Set(recent.map(v => v.servedBy)).size || 1);

      const predicted = Math.ceil((avgServiceTimeMins * queueData.metrics.waiting) / activeCounters);
      
      return { 
          time: Math.max(predicted, 1), 
          activeStaff: activeCounters 
      };
  };

  const prediction = calculatePredictedWait();

  const handleCounterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCounterName(e.target.value);
      localStorage.setItem('qblink_counter_name', e.target.value);
  };

  const playPreview = (type: string, vol: number) => {
    try {
        if (!previewAudioContextRef.current) {
             previewAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = previewAudioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);

        const osc = ctx.createOscillator();
        osc.type = type === 'chime' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(type === 'ding' ? 1200 : 800, ctx.currentTime);
        osc.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  };

  // QR Logic
  useEffect(() => {
    if (showQrModal && canvasRef.current) generateCustomQRCode();
  }, [showQrModal, logoPreview]);

  const generateCustomQRCode = async () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const width = 600, height = 800, qrSize = 480, padding = 60;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Embed name and location for offline/cross-device demo capability
    const params = new URLSearchParams();
    params.set('view', 'customer');
    params.set('queueId', queue.id);
    params.set('qName', currentQueue.name);
    if (currentQueue.location) params.set('qLoc', currentQueue.location);
    
    const joinUrl = `${window.location.origin}?${params.toString()}`;
    
    try {
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, joinUrl, { width: qrSize, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'H' });
        const qrX = (width - qrSize) / 2;
        ctx.drawImage(tempCanvas, qrX, padding);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(currentQueue.name, width / 2, padding + qrSize + 70);
        ctx.fillStyle = '#6B7280';
        ctx.font = '500 24px sans-serif';
        ctx.fillText('Scan to join the queue', width / 2, padding + qrSize + 110);
    } catch(e) {}
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `${currentQueue.name.replace(/\s+/g, '_')}_QR.png`;
    link.href = url;
    link.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setLogoPreview(base64);
              const updated = await queueService.updateQueue(user.id, queue.id, { logo: base64 });
              if (updated) setCurrentQueue(updated);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleSaveSettings = async () => {
      const updated = await queueService.updateQueue(user.id, queue.id, { settings });
      if (updated) {
          setCurrentQueue(updated);
          alert("Settings saved successfully!");
      }
  };

  const handleFeatureToggle = async (feature: string, value: boolean) => {
      const newFeatures = { ...currentQueue.features, [feature]: value };
      const updated = await queueService.updateQueue(user.id, queue.id, { features: newFeatures });
      if (updated) setCurrentQueue(updated);
  };

  const handleBusinessTypeChange = async (type: BusinessType) => {
      if (type === currentQueue.businessType) return;
      if (confirm(`Switching to ${type.charAt(0).toUpperCase() + type.slice(1)} will reset features to default. Continue?`)) {
          const defaultFeatures = queueService.getDefaultFeatures(type);
          const updated = await queueService.updateQueue(user.id, queue.id, { 
              businessType: type, 
              features: defaultFeatures 
          });
          if (updated) {
              setCurrentQueue(updated);
          }
      }
  };

  const handleGetInsight = async () => {
      if (!queueData) return;
      setIsLoadingInsight(true);
      const insight = await getQueueInsights(queueData.metrics);
      setAiInsight(insight);
      setIsLoadingInsight(false);
  };

  const handleSmartSort = async () => {
      if (!queueData) return;
      const waiting = queueData.visitors.filter(v => v.status === 'waiting');
      if (waiting.length < 2) return; // No need to sort

      setIsSmartSorting(true);
      setSmartSortReasoning(null);
      
      const result = await optimizeQueueOrder(waiting);
      
      if (result && result.orderedIds) {
          const idMap = new Map(waiting.map(v => [v.id, v]));
          const newOrder = result.orderedIds.map(id => idMap.get(id)).filter(Boolean) as Visitor[];
          const missing = waiting.filter(v => !result.orderedIds.includes(v.id));
          const finalOrder = [...newOrder, ...missing];

          await queueService.reorderQueue(queue.id, finalOrder);
          setSmartSortReasoning(result.reasoning);
          fetchData();
      }
      setIsSmartSorting(false);
  };

  const handleAnalyzeFeedback = async () => {
      if (!queueData) return;
      setIsAnalyzingFeedback(true);
      
      const feedbackItems = queueData.visitors
          .filter(v => v.feedback || (v.rating && v.rating > 0))
          .map(v => ({ rating: v.rating || 0, text: v.feedback }));
          
      const result = await analyzeCustomerFeedback(feedbackItems);
      setFeedbackAnalysis(result);
      setIsAnalyzingFeedback(false);
  };

  // --- ACTIONS ---
  const handleCallNext = async () => { await queueService.callNext(queue.id, counterName); fetchData(); };
  const handleCallByNumber = async (e: React.FormEvent) => { e.preventDefault(); const num = parseInt(callNumberInput); if (!isNaN(num)) { await queueService.callByNumber(queue.id, num, counterName); fetchData(); setShowCallModal(false); setCallNumberInput(''); } };
  const handleAddVisitor = async (e: React.FormEvent) => { e.preventDefault(); await queueService.joinQueue(queue.id, newVisitorName, undefined, 'manual'); fetchData(); setNewVisitorName(''); setShowAddModal(false); };
  const handleRemoveVisitors = async () => { if (confirm("Clear the entire waiting list?")) { await queueService.clearQueue(queue.id); fetchData(); } };
  const handleTakeBack = async () => { await queueService.takeBack(queue.id, counterName); fetchData(); };
  const handleNotifyCurrent = async () => { const v = queueData?.visitors.find(v => v.status === 'serving' && v.servedBy === counterName); if (v) { await queueService.triggerAlert(queue.id, v.id); fetchData(); } };
  
  const handleBroadcast = async (e: React.FormEvent) => {
      e.preventDefault();
      const updated = await queueService.updateQueue(user.id, queue.id, { announcement: announcementInput });
      if (updated) { setCurrentQueue(updated); }
  };

  const handleTogglePriority = async (visitorId: string, isPriority: boolean) => {
      await queueService.togglePriority(queue.id, visitorId, !isPriority);
      fetchData();
  };

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
          const waiting = currentData.visitors
              .filter(v => v.status === 'waiting')
              .sort((a, b) => (a.order || 999999) - (b.order || 999999));
          
          await queueService.reorderQueue(queue.id, waiting);
      }
  };

  const handleServeSpecific = async () => { if (selectedVisitor) { await queueService.callByNumber(queue.id, selectedVisitor.ticketNumber, counterName); setSelectedVisitor(null); fetchData(); } };
  const handleRemoveSpecific = async () => { if (selectedVisitor && confirm(`Remove ${selectedVisitor.name}?`)) { await queueService.leaveQueue(queue.id, selectedVisitor.id); setSelectedVisitor(null); fetchData(); } };
  
  const handleExportCSV = () => {
      queueService.exportStatsCSV(queue.id, currentQueue.name);
  };

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 text-xs">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p
              key={index}
              style={{ color: p.color }}
              className="font-medium flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!queueData) return <div className="p-12 text-center text-gray-500">Loading Queue Data...</div>;

  const waitingVisitors = queueData.visitors.filter(v => v.status === 'waiting').sort((a, b) => { 
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return a.ticketNumber - b.ticketNumber; 
  });

  const displayWaitingVisitors = searchQuery ? waitingVisitors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ticketNumber.toString().includes(searchQuery)) : waitingVisitors;
  const myCurrentVisitor = queueData.visitors.find(v => v.status === 'serving' && v.servedBy === counterName);

  const getCounterLabel = () => {
      if (currentQueue.businessType === 'restaurant') return 'Table / Station';
      if (currentQueue.businessType === 'clinic') return 'Room / Doctor';
      if (currentQueue.businessType === 'salon') return 'Stylist / Chair';
      return 'Counter Name';
  }

  return (
    <div className="container mx-auto px-4 pb-20 max-w-5xl">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {currentQueue.name}
                    {currentQueue.isPaused && <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1"><PauseCircle size={12} /> Paused</span>}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{currentQueue.code}</span>
                    {currentQueue.location && (
                        <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-sm font-bold text-gray-600 flex items-center gap-1">
                                <MapPin size={12} /> {currentQueue.location}
                            </span>
                        </>
                    )}
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    
                    {currentQueue.features.multiCounter && (
                        <div className="flex items-center gap-1 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100 focus-within:border-blue-300 transition-colors">
                            <Store size={12} className="text-blue-500" />
                            <input type="text" className="text-xs font-bold text-blue-700 bg-transparent outline-none w-24" value={counterName} onChange={handleCounterNameChange} placeholder={getCounterLabel()} />
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('operations')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'operations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Store size={16} /> <span className="hidden sm:inline">Operations</span>
                </button>
                <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <BarChart2 size={16} /> <span className="hidden sm:inline">Analytics</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Settings size={16} /> <span className="hidden sm:inline">Settings</span>
                </button>
            </div>
            
            <div className="flex gap-2">
                 <button 
                    onClick={() => setShowQrModal(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all hover:scale-105 active:scale-95" 
                    title="Show QR Code"
                 >
                    <QrCode size={18} /> 
                    <span className="hidden sm:inline">QR Code</span>
                </button>
                 <button onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm" title="Open Display">
                    <Share2 size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* OPERATIONS TAB */}
      {activeTab === 'operations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* ... (Operations Content remains same) ... */}
              <div className="mb-6">
                  <div className={`rounded-2xl p-4 border flex flex-col md:flex-row gap-4 items-center transition-all ${currentQueue.announcement ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <Megaphone size={16} className={currentQueue.announcement ? 'text-orange-600' : 'text-gray-400'} />
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Live Broadcast Message</span>
                            </div>
                            <form onSubmit={handleBroadcast} className="flex gap-2">
                                <input 
                                        type="text"
                                        placeholder="E.g. We are taking a 15 min break."
                                        value={announcementInput}
                                        onChange={(e) => setAnnouncementInput(e.target.value)}
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black">
                                    {announcementInput ? 'Update' : 'Clear'}
                                </button>
                            </form>
                        </div>
                  </div>
              </div>

              {/* Main Serving Card */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-6 md:p-8 text-center border border-white shadow-soft relative overflow-hidden mb-8">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                  <p className="text-gray-500 font-medium mb-4 uppercase tracking-widest text-xs">Serving at {counterName}</p>
                  
                  {myCurrentVisitor ? (
                      <motion.div key={myCurrentVisitor.ticketNumber} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          <div className="text-7xl md:text-9xl font-black text-gray-900 mb-2 tracking-tighter">
                              {String(myCurrentVisitor.ticketNumber).padStart(3, '0')}
                          </div>
                          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-800 rounded-full text-sm font-bold max-w-full truncate">
                              <span className="truncate">{myCurrentVisitor.name}</span>
                          </div>
                          {myCurrentVisitor.isAlerting && myCurrentVisitor.calledAt && (
                              <div className="flex justify-center mb-4">
                                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-yellow-200 flex items-center gap-1">
                                      <Clock size={12} /> Awaiting confirmation...
                                  </span>
                              </div>
                          )}
                      </motion.div>
                  ) : (
                      <div className="text-5xl md:text-7xl font-bold text-gray-300 mb-6 py-6">---</div>
                  )}

                  <div className="max-w-lg mx-auto grid grid-cols-4 gap-3">
                      <button onClick={handleCallNext} className="col-span-3 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                          <span className="hidden sm:inline">Call Next</span>
                          <span className="sm:hidden">Next</span>
                          <Phone size={20} />
                      </button>
                      <button onClick={handleNotifyCurrent} disabled={!myCurrentVisitor} className={`py-4 rounded-2xl font-bold text-lg shadow-sm border border-gray-200 flex items-center justify-center transition-all ${myCurrentVisitor?.isAlerting ? 'bg-yellow-400 text-white border-yellow-400 animate-pulse' : 'bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'}`}>
                          <Bell size={24} fill={myCurrentVisitor?.isAlerting ? "currentColor" : "none"} />
                      </button>
                  </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <button onClick={() => setShowCallModal(true)} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex flex-col items-center gap-2 shadow-sm">
                      <Phone size={20} className="text-gray-400" /><span className="text-xs md:text-sm text-center">Call by #</span>
                  </button>
                  <button onClick={() => setShowAddModal(true)} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex flex-col items-center gap-2 shadow-sm">
                      <UserPlus size={20} className="text-gray-400" /><span className="text-xs md:text-sm text-center">Add Visitor</span>
                  </button>
                  <button onClick={handleRemoveVisitors} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:border-red-100 transition-all flex flex-col items-center gap-2 shadow-sm">
                      <Trash2 size={20} className="text-red-400" /><span className="text-xs md:text-sm text-center">Clear Queue</span>
                  </button>
                  <button onClick={handleTakeBack} className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex flex-col items-center gap-2 shadow-sm">
                      <RotateCcw size={20} className="text-gray-400" /><span className="text-xs md:text-sm text-center">Take back</span>
                  </button>
              </div>

              {/* Smart Sort Banner & List would follow... (kept brief for diff) */}
              <AnimatePresence>
                  {smartSortReasoning && (
                      <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6 flex items-start gap-3"
                      >
                          <BrainCircuit size={20} className="text-purple-600 mt-0.5 shrink-0" />
                          <div>
                              <h4 className="text-sm font-bold text-purple-900">AI Reorder Applied</h4>
                              <p className="text-xs text-purple-700 mt-1 leading-relaxed">{smartSortReasoning}</p>
                              <button onClick={() => setSmartSortReasoning(null)} className="text-xs font-bold text-purple-600 hover:underline mt-2">Dismiss</button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              {/* Waiting List */}
              <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8">
                  <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-gray-900">Waiting List</h3>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{queueData.metrics.waiting} Total</span>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" placeholder="Search name or ticket..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all" />
                          </div>
                          <button 
                              onClick={handleSmartSort}
                              disabled={isSmartSorting || queueData.metrics.waiting < 2}
                              className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors disabled:opacity-50 text-sm font-bold"
                              title="Smart Sort with AI"
                          >
                              {isSmartSorting ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />}
                              <span className="hidden sm:inline">Smart Sort</span>
                          </button>
                      </div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto p-1">
                      {displayWaitingVisitors.length > 0 ? (
                          searchQuery ? (
                             <div>{displayWaitingVisitors.map((visitor) => <VisitorListItem key={visitor.id} visitor={visitor} queueData={queueData!} onTogglePriority={() => handleTogglePriority(visitor.id, !!visitor.isPriority)} onClick={() => setSelectedVisitor(visitor)} features={currentQueue.features} />)}</div>
                          ) : (
                            <Reorder.Group axis="y" values={displayWaitingVisitors} onReorder={handleReorder}>
                                {displayWaitingVisitors.map((visitor) => (
                                    <DraggableVisitorListItem 
                                        key={visitor.id} 
                                        visitor={visitor} 
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
                        <div className="p-12 text-center text-gray-400">{searchQuery ? "No visitors found matching your search." : "No visitors in the queue."}</div>
                      )}
                  </div>
              </div>
          </motion.div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
                      <p className="text-gray-500 text-sm">Real-time statistics for {currentQueue.name}.</p>
                  </div>
                  <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors w-full md:w-auto justify-center">
                      <Download size={16} /> Export CSV
                  </button>
              </div>

              {/* Top Row: AI & Prediction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Predictive Wait Time */}
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[200px]">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                              <Zap size={20} className="text-yellow-300 fill-yellow-300" />
                              <h4 className="text-sm font-bold uppercase tracking-widest text-blue-100">
                                Smart Prediction
                                {currentQueue.location && <span className="opacity-70 ml-1">for {currentQueue.location}</span>}
                              </h4>
                          </div>
                          <p className="text-blue-100 text-sm opacity-90">
                              Estimated based on {prediction.activeStaff} active staff member{prediction.activeStaff > 1 ? 's' : ''} and recent service duration.
                          </p>
                      </div>
                      <div className="relative z-10 mt-6">
                          <div className="text-5xl font-black tracking-tight">{prediction.time}<span className="text-2xl font-bold text-blue-200 ml-1">min</span></div>
                          <p className="text-xs font-bold text-blue-200 uppercase mt-1">Current Wait Time</p>
                      </div>
                  </div>

                  {/* AI Insight */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-[32px] border border-purple-100 relative overflow-hidden flex flex-col h-full min-h-[200px]">
                      <div className="relative z-10 flex-1">
                          <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={18} className="text-purple-600" />
                              <h4 className="text-sm font-bold text-purple-800 uppercase tracking-widest">AI Insights</h4>
                          </div>
                          {aiInsight ? (
                              <p className="text-lg font-medium text-gray-800 leading-relaxed">
                                  "{aiInsight}"
                              </p>
                          ) : (
                              <div className="text-center py-4">
                                  <p className="text-gray-500 text-sm mb-4">
                                      Analyze queue performance to get actionable advice.
                                  </p>
                              </div>
                          )}
                      </div>
                      <button 
                          onClick={handleGetInsight} 
                          disabled={isLoadingInsight}
                          className="relative z-10 w-full px-4 py-3 bg-white text-purple-700 font-bold text-sm rounded-xl shadow-sm hover:bg-purple-100/50 transition-colors flex items-center justify-center gap-2 mt-4"
                      >
                          {isLoadingInsight ? 'Analyzing...' : 'Ask AI Assistant'}
                      </button>
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Served</p>
                      <p className="text-3xl font-black text-gray-900">{queueData.metrics.served}</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Wait</p>
                      <p className="text-3xl font-black text-gray-900">{queueData.metrics.avgWaitTime}m</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Waiting</p>
                      <p className="text-3xl font-black text-gray-900">{queueData.metrics.waiting}</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Satisfaction</p>
                      <div className="flex items-center gap-1">
                          <p className="text-3xl font-black text-gray-900">{queueData.metrics.averageRating > 0 ? queueData.metrics.averageRating : '-'}</p>
                          {queueData.metrics.averageRating > 0 && <Star className="text-yellow-400 fill-yellow-400 ml-1" size={20} />}
                      </div>
                  </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hourly Traffic - Stacked Bar */}
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 min-h-[350px] flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <TrendingUp size={20} className="text-primary-600" /> Hourly Traffic
                          </h4>
                      </div>
                      <div className="flex-1 w-full min-h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                                  <Legend iconType="circle" verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                  <Bar dataKey="joined" stackId="a" fill="#3b82f6" name="Joined" radius={[0, 0, 0, 0]} />
                                  <Bar dataKey="served" stackId="a" fill="#22c55e" name="Served" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Visitor Status - Pie Chart */}
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 min-h-[350px] flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <PieChartIcon size={20} className="text-orange-500" /> Visitor Status
                          </h4>
                      </div>
                      <div className="flex-1 w-full min-h-[250px] relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                              </PieChart>
                          </ResponsiveContainer>
                          {/* Center Text */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-[90px]">
                              <span className="text-2xl font-black text-gray-900">
                                  {pieData.reduce((acc: number, curr: any) => acc + (curr.name !== 'No Data' ? curr.value : 0), 0)}
                              </span>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Feedback Analysis Card */}
              <div className="border border-gray-100 rounded-[32px] p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <MessageSquare size={18} className="text-gray-500" /> AI Feedback Analysis
                      </h4>
                      <button 
                          onClick={handleAnalyzeFeedback}
                          disabled={isAnalyzingFeedback}
                          className="text-xs font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors border border-primary-100"
                      >
                          {isAnalyzingFeedback ? 'Analyzing...' : 'Analyze Feedback'}
                      </button>
                  </div>
                  
                  {feedbackAnalysis ? (
                      <div className="space-y-4 animate-fade-in bg-gray-50 p-4 rounded-2xl">
                          <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                  feedbackAnalysis.sentiment === 'positive' ? 'bg-green-100 text-green-700 border-green-200' :
                                  feedbackAnalysis.sentiment === 'negative' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                  {feedbackAnalysis.sentiment} Sentiment
                              </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                              "{feedbackAnalysis.summary}"
                          </p>
                          <div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Key Topics</span>
                              <div className="flex flex-wrap gap-2">
                                  {feedbackAnalysis.keywords.map((k, i) => (
                                      <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600">
                                          #{k}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-8 text-gray-400 text-sm bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <Sparkles size={24} className="mx-auto mb-2 opacity-30" />
                          <p>Run analysis to get AI-powered insights from customer feedback.</p>
                      </div>
                  )}
              </div>
          </motion.div>
      )}

      {/* Settings Tab ... (Rest remains unchanged) */}
      {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Queue Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Branding */}
                  <div className="space-y-4">
                      {/* Business Type Selection */}
                      <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-3">Business Type</label>
                          <div className="grid grid-cols-3 gap-2">
                              {businessTypes.map((b) => (
                                  <button
                                      key={b.type}
                                      onClick={() => handleBusinessTypeChange(b.type)}
                                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${currentQueue.businessType === b.type ? 'bg-white border-primary-500 text-primary-600 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                                  >
                                      <b.icon size={20} />
                                      <span className="text-[10px] font-bold">{b.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <h4 className="font-bold text-gray-700 flex items-center gap-2"><Palette size={18} /> Branding</h4>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Theme Color</label>
                          <div className="flex gap-2 flex-wrap items-center">
                              {['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#000000'].map(color => (
                                  <button 
                                    key={color} 
                                    onClick={() => setSettings({...settings, themeColor: color})}
                                    className={`w-8 h-8 rounded-full border-2 ${settings.themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                    style={{backgroundColor: color}}
                                  />
                              ))}
                              {/* Custom Color Input */}
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                                  <input 
                                    type="color" 
                                    value={settings.themeColor} 
                                    onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 border-0 cursor-pointer"
                                  />
                                  <Pipette size={14} className="pointer-events-none text-gray-500 relative z-10" />
                              </div>
                          </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Logo</label>
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                                  {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                              </div>
                              <label className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50">
                                  Upload
                                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                              </label>
                          </div>
                      </div>
                  </div>

                  {/* Automation & Sound */}
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2"><Sliders size={18} /> Automation & Features</h4>
                      
                      {/* Grace Period */}
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Grace Period (Call to Presence)</label>
                          <select 
                            value={settings.gracePeriodMinutes || 2}
                            onChange={(e) => setSettings({...settings, gracePeriodMinutes: parseInt(e.target.value)})}
                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                          >
                              <option value={1}>1 Minute</option>
                              <option value={2}>2 Minutes (Default)</option>
                              <option value={3}>3 Minutes</option>
                              <option value={5}>5 Minutes</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">Time for customer to confirm they are here before moving to back of queue.</p>
                      </div>

                      {/* Auto Skip */}
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Auto-Complete/Skip (Service Timeout)</label>
                          <select 
                            value={settings.autoSkipMinutes || 0}
                            onChange={(e) => setSettings({...settings, autoSkipMinutes: parseInt(e.target.value)})}
                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                          >
                              <option value={0}>Disabled</option>
                              <option value={10}>10 Minutes</option>
                              <option value={20}>20 Minutes</option>
                              <option value={30}>30 Minutes</option>
                              <option value={60}>60 Minutes</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">Automatically mark as skipped if 'serving' takes too long (e.g. no-shows).</p>
                      </div>

                      {/* Feature Toggles */}
                      <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-700">VIP Priority</label>
                              <button onClick={() => handleFeatureToggle('vip', !currentQueue.features.vip)}>
                                  {currentQueue.features.vip ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                              </button>
                          </div>
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-700">Multi-Counter/Table</label>
                              <button onClick={() => handleFeatureToggle('multiCounter', !currentQueue.features.multiCounter)}>
                                  {currentQueue.features.multiCounter ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                              </button>
                          </div>
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-700">Anonymous Mode</label>
                              <button onClick={() => handleFeatureToggle('anonymousMode', !currentQueue.features.anonymousMode)}>
                                  {currentQueue.features.anonymousMode ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                              </button>
                          </div>
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-gray-700 flex items-center gap-1"><MessageSquare size={14} /> SMS Notifications</label>
                              <button onClick={() => setSettings({...settings, enableSMS: !settings.enableSMS})}>
                                  {settings.enableSMS ? <ToggleRight size={24} className="text-primary-600" /> : <ToggleLeft size={24} className="text-gray-400" />}
                              </button>
                          </div>
                      </div>

                      {/* Sound Settings */}
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-gray-700">Sound Alert</label>
                              <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => setSettings({...settings, soundEnabled: e.target.checked})} />
                          </div>
                          {settings.soundEnabled && (
                              <div className="space-y-3 mt-3">
                                  <div className="flex gap-2">
                                      {['beep', 'chime', 'ding'].map(t => (
                                          <button 
                                            key={t}
                                            onClick={() => setSettings({...settings, soundType: t as any})}
                                            className={`px-3 py-1 rounded text-xs font-bold capitalize ${settings.soundType === t ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}
                                          >
                                              {t}
                                          </button>
                                      ))}
                                  </div>
                                  <input type="range" min="0" max="1" step="0.1" value={settings.soundVolume} onChange={(e) => setSettings({...settings, soundVolume: parseFloat(e.target.value)})} className="w-full" />
                                  <button onClick={() => playPreview(settings.soundType, settings.soundVolume)} className="text-xs font-bold text-primary-600 flex items-center gap-1"><Play size={12} /> Test Sound</button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button onClick={handleSaveSettings} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 flex items-center gap-2">
                      <Save size={18} /> Save Changes
                  </button>
              </div>
          </motion.div>
      )}

      {/* --- MODALS --- */}
      <AnimatePresence>
          {selectedVisitor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full relative overflow-hidden">
                      <button onClick={() => setSelectedVisitor(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                      <div className="text-center pt-8">
                          <div className="text-5xl font-black mb-2">{selectedVisitor.ticketNumber}</div>
                          <h3 className="text-xl font-bold mb-6">{selectedVisitor.name}</h3>
                          
                          {selectedVisitor.isLate && (
                              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 border border-red-100">
                                  ⚠️ This customer missed their turn and was moved to the back.
                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mb-4">
                              {currentQueue.features.vip && (
                                <button onClick={() => handleTogglePriority(selectedVisitor.id, !!selectedVisitor.isPriority)} className={`py-3 rounded-xl font-bold text-sm ${selectedVisitor.isPriority ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>VIP</button>
                              )}
                              <button onClick={handleServeSpecific} className={`py-3 bg-primary-600 text-white rounded-xl font-bold text-sm ${!currentQueue.features.vip ? 'col-span-2' : ''}`}>Serve</button>
                          </div>
                          <button onClick={handleRemoveSpecific} className="w-full py-3 text-red-500 font-bold text-sm">Remove</button>
                      </div>
                  </motion.div>
              </div>
          )}
          {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full">
                      <h3 className="text-xl font-bold mb-4">Add Visitor</h3>
                      <form onSubmit={handleAddVisitor}>
                          <input autoFocus type="text" placeholder="Visitor Name" value={newVisitorName} onChange={(e) => setNewVisitorName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-lg" />
                          <div className="flex gap-3"><button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Add</button></div>
                      </form>
                  </motion.div>
              </div>
          )}
          {showCallModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full">
                      <h3 className="text-xl font-bold mb-4">Call Number</h3>
                      <form onSubmit={handleCallByNumber}>
                          <input autoFocus type="number" placeholder="#" value={callNumberInput} onChange={(e) => setCallNumberInput(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-lg" />
                          <div className="flex gap-3"><button type="button" onClick={() => setShowCallModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Call</button></div>
                      </form>
                  </motion.div>
              </div>
          )}
          {showQrModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                      <h3 className="text-xl font-bold mb-4">Scan to Join</h3>
                      <div className="flex justify-center mb-6">
                        <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-sm border border-gray-100" />
                      </div>
                      
                      <div className="mb-6 p-3 bg-yellow-50 text-yellow-800 text-xs font-bold rounded-xl border border-yellow-100 flex items-center justify-center gap-2">
                          <Zap size={14} className="text-yellow-600" />
                          <span>Demo Mode: Works offline on same device.</span>
                      </div>

                      <div className="flex gap-3">
                          <button onClick={downloadQRCode} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-600/20">
                              <Download size={18} /> Download
                          </button>
                          <button onClick={() => setShowQrModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                              Close
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

const DraggableVisitorListItem: React.FC<{ 
    visitor: Visitor, 
    queueData: QueueData, 
    handleTogglePriority: (id: string, current: boolean) => void, 
    setSelectedVisitor: (v: Visitor) => void, 
    features: any,
    onDragEnd: () => void 
}> = ({ visitor, queueData, handleTogglePriority, setSelectedVisitor, features, onDragEnd }) => {
    const dragControls = useDragControls();
    return (
        <Reorder.Item value={visitor} id={visitor.id} dragListener={false} dragControls={dragControls} onDragEnd={onDragEnd}>
            <VisitorListItem visitor={visitor} queueData={queueData} onTogglePriority={() => handleTogglePriority(visitor.id, !!visitor.isPriority)} onClick={() => setSelectedVisitor(visitor)} isDraggable={true} onDragStart={(e) => dragControls.start(e)} features={features} />
        </Reorder.Item>
    );
};

const VisitorListItem: React.FC<{ visitor: Visitor; queueData: QueueData; onTogglePriority: () => void; onClick: () => void; isDraggable?: boolean; onDragStart?: (e: React.PointerEvent) => void; features: any }> = ({ visitor, queueData, onTogglePriority, onClick, isDraggable, onDragStart, features }) => (
    <div onClick={onClick} className={`p-4 flex items-center justify-between rounded-2xl mb-1 border transition-all cursor-pointer select-none ${visitor.isPriority ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200' : 'bg-white border-transparent border-b-gray-50'}`}>
        <div className="flex items-center gap-4">
             {isDraggable && <div className="text-gray-300 hover:text-gray-500 cursor-grab p-1 active:cursor-grabbing" onPointerDown={onDragStart} onClick={(e) => e.stopPropagation()}><GripVertical size={20} /></div>}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${visitor.isPriority ? 'bg-amber-400 text-white' : 'bg-blue-600 text-white'}`}>
                {String(visitor.ticketNumber).padStart(3, '0')}
            </div>
            <div>
                <p className={`font-bold ${visitor.isPriority ? 'text-amber-900' : 'text-gray-900'}`}>{visitor.name} {visitor.isPriority && <span className="text-[10px] bg-amber-200 px-1 rounded ml-1">VIP</span>}</p>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">Joined {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    {visitor.isLate && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-200">LATE</span>}
                </div>
            </div>
        </div>
        {features.vip && (
            <button onClick={(e) => { e.stopPropagation(); onTogglePriority(); }} className={`p-2 rounded-full ${visitor.isPriority ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}><Star size={20} fill={visitor.isPriority ? "currentColor" : "none"} /></button>
        )}
     </div>
);

export default QueueManager;
