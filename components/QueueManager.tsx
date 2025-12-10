
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, QueueData, QueueInfo, Visitor, QueueSettings } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Image as ImageIcon, CheckCircle, RefreshCw, GripVertical, Settings, Volume2, Play, Save, PauseCircle, PlayCircle, Megaphone, Star, Clock, TrendingUp, UserCheck, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts';

interface QueueManagerProps {
  user: User;
  queue: QueueInfo;
  onBack: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user, queue, onBack }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentQueue, setCurrentQueue] = useState<QueueInfo>(queue);
  
  // Modal States
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  
  // New: Visitor Detail Modal
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  
  // UI States
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(queue.announcement || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings State
  const [settings, setSettings] = useState<QueueSettings>(currentQueue.settings || {
      soundEnabled: true,
      soundVolume: 1.0,
      soundType: 'beep'
  });

  // QR Generation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentQueue.logo || null);

  // Audio Context for preview
  const previewAudioContextRef = useRef<AudioContext | null>(null);

  const fetchData = useCallback(async () => {
      try {
          const data = await queueService.getQueueData(queue.id);
          setQueueData(data);
          // Also refresh queue info in case of status changes
          const info = await queueService.getQueueInfo(queue.id);
          if (info) setCurrentQueue(info);
      } catch (e) {
          console.error("Failed to fetch queue data", e);
      }
  }, [queue.id]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Join Socket Room
    socketService.joinQueue(queue.id);

    // Listen for events
    socketService.on('queue:update', () => {
        fetchData();
    });

    socketService.on('customer_response', () => {
        fetchData();
    });

    return () => {
        socketService.off('queue:update');
        socketService.off('customer_response');
    };
  }, [fetchData, queue.id]);

  const playPreview = (type: string, vol: number) => {
    try {
        if (!previewAudioContextRef.current) {
             previewAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = previewAudioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        gainNode.gain.setValueAtTime(vol, ctx.currentTime);

        switch (type) {
            case 'chime':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 1.5);
                break;
            case 'alarm':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
                break;
            case 'beep':
            default:
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.error("Audio preview failed", e);
    }
  };

  // QR Code Rendering Logic
  useEffect(() => {
    if (showQrModal && canvasRef.current) {
        generateCustomQRCode();
    }
  }, [showQrModal, logoPreview]);

  const generateCustomQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimized High-Res Canvas Layout for Printing
    const width = 600;
    const height = 800;
    const qrSize = 480;
    const padding = 60;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const joinUrl = `${window.location.origin}?view=customer&queueId=${queue.id}`;
    
    try {
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, joinUrl, {
            width: qrSize,
            margin: 1,
            color: {
                dark: '#000000', // Pure black for max contrast
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        });
        
        // Draw QR
        const qrX = (width - qrSize) / 2;
        const qrY = padding;
        ctx.drawImage(tempCanvas, qrX, qrY);
        
        // Overlay Logo if exists
        if (logoPreview) {
            const img = new Image();
            img.src = logoPreview;
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; 
            });
            
            const logoSize = qrSize * 0.2;
            const lx = qrX + (qrSize - logoSize) / 2;
            const ly = qrY + (qrSize - logoSize) / 2;
            
            // Logo background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(lx - 8, ly - 8, logoSize + 16, logoSize + 16);
            
            ctx.drawImage(img, lx, ly, logoSize, logoSize);
        }

        // Add Text Details for better usability
        ctx.textAlign = 'center';
        
        // Queue Name
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(currentQueue.name, width / 2, qrY + qrSize + 70);

        // Helper Text
        ctx.fillStyle = '#6B7280';
        ctx.font = '500 24px sans-serif';
        ctx.fillText('Scan to join the queue', width / 2, qrY + qrSize + 110);
        
        // Brand
        ctx.fillStyle = '#E5E7EB';
        ctx.font = '14px sans-serif';
        ctx.fillText('Powered by Qblink', width / 2, height - 20);

    } catch (e) {
        console.error("QR Generation failed", e);
    }
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
      if (updated) setCurrentQueue(updated);
      setShowSettingsModal(false);
  };

  const handleDownloadQR = () => {
      if (canvasRef.current) {
          const link = document.createElement('a');
          link.download = `qblink-qr-${queue.code}.png`;
          link.href = canvasRef.current.toDataURL('image/png');
          link.click();
      }
  };

  const handleCallNext = async () => {
    await queueService.callNext(queue.id);
    fetchData();
  };

  const handleCallByNumber = async (e: React.FormEvent) => {
      e.preventDefault();
      const num = parseInt(callNumberInput);
      if (!isNaN(num)) {
          await queueService.callByNumber(queue.id, num);
          fetchData();
          setShowCallModal(false);
          setCallNumberInput('');
      }
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
      e.preventDefault();
      await queueService.joinQueue(queue.id, newVisitorName, 'manual');
      fetchData();
      setNewVisitorName('');
      setShowAddModal(false);
  };

  const handleRemoveVisitors = async () => {
      if (confirm("Are you sure you want to clear the entire waiting list?")) {
          await queueService.clearQueue(queue.id);
          fetchData();
      }
  };

  const handleTakeBack = async () => {
      await queueService.takeBack(queue.id);
      fetchData();
  };
  
  const handleRecall = async (visitorId: string) => {
      await queueService.recallVisitor(queue.id, visitorId);
      fetchData();
  };

  const handleNotifyCurrent = async () => {
      const currentVisitor = queueData?.visitors.find(v => v.status === 'serving');
      if (currentVisitor) {
          await queueService.triggerAlert(queue.id, currentVisitor.id);
          fetchData();
      }
  };

  const handleTogglePause = async () => {
      const newStatus = !currentQueue.isPaused;
      const updated = await queueService.updateQueue(user.id, queue.id, { isPaused: newStatus });
      if (updated) setCurrentQueue(updated);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
      e.preventDefault();
      const updated = await queueService.updateQueue(user.id, queue.id, { announcement: announcementInput });
      if (updated) {
          setCurrentQueue(updated);
          setShowBroadcast(false);
      }
  };

  const handleTogglePriority = async (visitorId: string, isPriority: boolean) => {
      const newPriorityStatus = !isPriority;
      
      // 1. Optimistic Update: Selected Visitor Modal
      if (selectedVisitor && selectedVisitor.id === visitorId) {
          setSelectedVisitor({ ...selectedVisitor, isPriority: newPriorityStatus });
      }

      // 2. Optimistic Update: Queue List Background
      if (queueData) {
          setQueueData({
              ...queueData,
              visitors: queueData.visitors.map(v => 
                  v.id === visitorId ? { ...v, isPriority: newPriorityStatus } : v
              )
          });
      }

      // 3. API Call
      await queueService.togglePriority(queue.id, visitorId, newPriorityStatus);
      
      // 4. Background Refresh (to ensure consistency)
      fetchData();
  };

  const handleReorder = async (newOrder: Visitor[]) => {
      // Optimistic update
      if (!queueData) return;
      
      const otherVisitors = queueData.visitors.filter(v => v.status !== 'waiting');
      // Reconstruct the full list with new waiting order
      const fullNewList = [...otherVisitors, ...newOrder];
      
      // Update local state first for smoothness
      setQueueData({
          ...queueData,
          visitors: fullNewList.sort((a,b) => {
               if(a.status === 'waiting' && b.status === 'waiting') return 0; // maintain drag order
               return 0; // Logic handled by the Reorder component mostly for display
          })
      });

      // Send to backend
      await queueService.reorderQueue(queue.id, fullNewList);
      fetchData();
  };

  const handleServeSpecific = async () => {
      if (selectedVisitor) {
          await queueService.callByNumber(queue.id, selectedVisitor.ticketNumber);
          setSelectedVisitor(null);
          fetchData();
      }
  };

  const handleRemoveSpecific = async () => {
      if (selectedVisitor && confirm(`Remove ${selectedVisitor.name} from the queue?`)) {
          await queueService.leaveQueue(queue.id, selectedVisitor.id);
          setSelectedVisitor(null);
          fetchData();
      }
  };
  
  // Chart Data Calculation
  const chartData = useMemo(() => {
    if (!queueData) return [];
    const data = [];
    const now = new Date();
    // Generate last 6 hours
    for (let i = 5; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = t.getHours();
        
        // Filter visitors served in this specific hour/date
        const servedInHour = queueData.visitors.filter(v => {
            if (v.status !== 'served' || !v.servedTime) return false;
            const vt = new Date(v.servedTime);
            return vt.getHours() === hour && vt.getDate() === t.getDate();
        });

        const count = servedInHour.length;
        const totalWait = servedInHour.reduce((sum, v) => {
             const join = new Date(v.joinTime).getTime();
             const serve = new Date(v.servedTime!).getTime();
             return sum + (serve - join);
        }, 0);
        
        // Convert to minutes
        const avgWait = count > 0 ? Math.round(totalWait / count / 60000) : 0;
        
        data.push({
            time: `${hour}:00`,
            served: count,
            wait: avgWait
        });
    }
    return data;
  }, [queueData]);

  if (!queueData) return <div className="p-12 text-center text-gray-500">Loading Queue Data...</div>;

  const waitingVisitors = queueData.visitors.filter(v => v.status === 'waiting');
  // Sort logic for waiting visitors is handled by the backend/drag-drop usually, but we filter them here.
  // If we are searching, we filter further.
  const displayWaitingVisitors = searchQuery 
    ? waitingVisitors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ticketNumber.toString().includes(searchQuery))
    : waitingVisitors;

  const servedVisitors = queueData.visitors
    .filter(v => v.status === 'served')
    .sort((a, b) => new Date(b.servedTime || 0).getTime() - new Date(a.servedTime || 0).getTime())
    .slice(0, 10);

  const currentVisitor = queueData.visitors.find(v => v.status === 'serving');

  // Calculations for Advanced Stats
  const servedLastHour = queueData.visitors.filter(v => {
      if (v.status !== 'served' || !v.servedTime) return false;
      const servedTime = new Date(v.servedTime).getTime();
      return servedTime > Date.now() - 3600000;
  }).length;

  return (
    <div className="container mx-auto px-4 pb-20 max-w-5xl">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {currentQueue.name}
                    {currentQueue.isPaused && (
                         <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                             <PauseCircle size={12} /> Paused
                         </span>
                    )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{currentQueue.code}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <button 
                        onClick={handleTogglePause}
                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${currentQueue.isPaused ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                        {currentQueue.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                        {currentQueue.isPaused ? 'Resume Queue' : 'Active'}
                    </button>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowBroadcast(!showBroadcast)}
                className={`p-2.5 border rounded-xl shadow-sm flex items-center gap-2 transition-all ${currentQueue.announcement ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                title="Broadcast Announcement"
            >
                <Megaphone size={20} /> <span className="hidden sm:inline font-bold text-sm">Message</span>
            </button>
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2"
                title="Queue Settings"
            >
                <Settings size={20} /> <span className="hidden sm:inline font-bold text-sm">Settings</span>
            </button>
            <button 
                onClick={() => setShowQrModal(true)}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2"
            >
                <QrCode size={20} /> <span className="hidden sm:inline font-bold text-sm">QR Code</span>
            </button>
             <button 
                onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2"
                title="Open Display Screen"
            >
                <Share2 size={20} /> <span className="hidden sm:inline font-bold text-sm">Display</span>
            </button>
        </div>
      </div>

      {/* Broadcast Banner Input */}
      <AnimatePresence>
          {showBroadcast && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                  <form onSubmit={handleBroadcast} className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex gap-2">
                      <div className="flex-1">
                           <input 
                                type="text"
                                placeholder="E.g. We are taking a 15 min break."
                                value={announcementInput}
                                onChange={(e) => setAnnouncementInput(e.target.value)}
                                className="w-full bg-white border-orange-200 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 placeholder:text-orange-300"
                           />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600">
                          {announcementInput ? 'Post' : 'Clear'}
                      </button>
                  </form>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Main Status Card + Stats Grid */}
      <div className="mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-6 md:p-8 text-center border border-white shadow-soft relative overflow-hidden mb-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <p className="text-gray-500 font-medium mb-4 uppercase tracking-widest text-xs">Last called visitor number</p>
              
              <motion.div 
                key={queueData.lastCalledNumber}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl md:text-9xl lg:text-[120px] leading-none font-black text-gray-900 mb-6 tracking-tighter"
              >
                  {String(queueData.lastCalledNumber).padStart(3, '0')}
              </motion.div>

              {currentVisitor && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-800 rounded-full text-sm font-bold max-w-full truncate"
                  >
                      <span className="truncate">Serving: {currentVisitor.name}</span>
                  </motion.div>
              )}

              <div className="max-w-lg mx-auto grid grid-cols-4 gap-3">
                  <button 
                    onClick={handleCallNext}
                    className="col-span-3 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                      <span className="hidden sm:inline">Call next visitor</span>
                      <span className="sm:hidden">Call Next</span>
                      <Phone size={20} />
                  </button>

                  <button 
                    onClick={handleNotifyCurrent}
                    disabled={!currentVisitor}
                    className={`py-4 rounded-2xl font-bold text-lg shadow-sm border border-gray-200 flex items-center justify-center transition-all ${currentVisitor?.isAlerting ? 'bg-yellow-400 text-white border-yellow-400 animate-pulse' : 'bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    title="Notify Current Visitor"
                  >
                      <Bell size={24} fill={currentVisitor?.isAlerting ? "currentColor" : "none"} />
                  </button>
              </div>
          </div>

          {/* Enhanced Detailed Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Waiting Now - Simple Big Card */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                      <Users size={24} />
                  </div>
                  <span className="text-4xl font-black text-gray-900">{queueData.metrics.waiting}</span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Waiting Now</span>
              </div>

              {/* Served Trend - Bar Chart */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group min-h-[160px]">
                  <div className="flex justify-between items-start mb-4 z-10">
                      <div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Served (1h)</span>
                          <div className="text-3xl font-black text-gray-900 mt-1">{servedLastHour}</div>
                      </div>
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                          <UserCheck size={20} />
                      </div>
                  </div>
                  {/* Mini Bar Chart */}
                  <div className="h-16 w-full mt-auto relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <Bar dataKey="served" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                              <Tooltip 
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                              />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Wait Time Trend - Area Chart */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden min-h-[160px]">
                  <div className="flex justify-between items-start mb-4 z-10">
                      <div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Avg Wait Time</span>
                          <div className="text-3xl font-black text-gray-900 mt-1">{queueData.metrics.avgWaitTime}<span className="text-lg text-gray-400 font-medium ml-1">m</span></div>
                      </div>
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <Clock size={20} />
                      </div>
                  </div>
                  {/* Mini Area Chart */}
                  <div className="h-16 w-full mt-auto relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <Tooltip 
                                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                              />
                              <Area type="monotone" dataKey="wait" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorWait)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button 
            onClick={() => setShowCallModal(true)}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <Phone size={20} className="text-gray-400" />
              <span className="text-xs md:text-sm text-center">Call by number</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <UserPlus size={20} className="text-gray-400" />
              <span className="text-xs md:text-sm text-center">Add Visitor</span>
          </button>
          <button 
            onClick={handleRemoveVisitors}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:border-red-100 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <Trash2 size={20} className="text-red-400" />
              <span className="text-xs md:text-sm text-center">Clear Queue</span>
          </button>
          <button 
            onClick={handleTakeBack}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <RotateCcw size={20} className="text-gray-400" />
              <span className="text-xs md:text-sm text-center">Take back</span>
          </button>
      </div>

      {/* Waiting List - Animated & Reorderable */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">Waiting List</h3>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{queueData.metrics.waiting} Total</span>
              </div>
              
              <div className="relative w-full sm:w-auto">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                      type="text" 
                      placeholder="Search name or ticket..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
              </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto p-1">
              {displayWaitingVisitors.length > 0 ? (
                  searchQuery ? (
                     // Not reorderable when searching
                     <div>
                        {displayWaitingVisitors.map((visitor) => (
                           <VisitorListItem 
                                key={visitor.id} 
                                visitor={visitor} 
                                queueData={queueData} 
                                onTogglePriority={() => handleTogglePriority(visitor.id, !!visitor.isPriority)}
                                onClick={() => setSelectedVisitor(visitor)}
                           />
                        ))}
                     </div>
                  ) : (
                    // Drag and Drop List
                    <Reorder.Group axis="y" values={displayWaitingVisitors} onReorder={handleReorder}>
                        {displayWaitingVisitors.map((visitor) => (
                             <Reorder.Item key={visitor.id} value={visitor}>
                                 <VisitorListItem 
                                    visitor={visitor} 
                                    queueData={queueData} 
                                    onTogglePriority={() => handleTogglePriority(visitor.id, !!visitor.isPriority)}
                                    onClick={() => setSelectedVisitor(visitor)}
                                    isDraggable
                                />
                             </Reorder.Item>
                        ))}
                    </Reorder.Group>
                  )
              ) : (
                <div className="p-12 text-center text-gray-400">
                    {searchQuery ? "No visitors found matching your search." : "No visitors in the queue."}
                </div>
              )}
          </div>
      </div>

      {/* Served List */}
      {servedVisitors.length > 0 && (
          <div className="bg-white rounded-[32px] shadow-sm overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
              <div className="p-6 border-b border-gray-50">
                  <h3 className="font-bold text-lg text-gray-900">Recently Served</h3>
              </div>
              <div>
                  {servedVisitors.map((visitor) => (
                      <div key={visitor.id} className="p-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold text-sm">
                                   {String(visitor.ticketNumber).padStart(3, '0')}
                               </div>
                               <div>
                                   <p className="font-bold text-gray-700 text-sm strike-through">{visitor.name}</p>
                                   <div className="flex items-center gap-1 text-xs text-gray-400">
                                       <CheckCircle size={10} /> Served at {visitor.servedTime ? new Date(visitor.servedTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
                                   </div>
                               </div>
                           </div>
                           <button 
                                onClick={() => handleRecall(visitor.id)}
                                className="text-xs font-bold text-primary-600 hover:underline"
                           >
                               Recall
                           </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- MODALS --- */}

      {/* Visitor Detail Modal */}
      <AnimatePresence>
          {selectedVisitor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative overflow-hidden"
                  >
                      {/* Decorative Background */}
                      <div className={`absolute top-0 left-0 right-0 h-24 ${selectedVisitor.isPriority ? 'bg-gradient-to-br from-amber-300 to-yellow-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}></div>
                      <button onClick={() => setSelectedVisitor(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors z-10"><X size={20} /></button>

                      <div className="relative pt-8 flex flex-col items-center text-center">
                          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black shadow-xl mb-4 border-4 border-white ${selectedVisitor.isPriority ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-900'}`}>
                              {String(selectedVisitor.ticketNumber).padStart(3, '0')}
                          </div>
                          
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedVisitor.name}</h2>
                          <div className="flex items-center gap-2 mb-6">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                  Wait: ~{Math.max(1, (selectedVisitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                              </span>
                              {selectedVisitor.isPriority && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase">VIP</span>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 w-full mb-6">
                              {/* VIP Toggle - Enhanced */}
                              <button 
                                onClick={() => handleTogglePriority(selectedVisitor.id, !!selectedVisitor.isPriority)}
                                className={`col-span-2 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-sm ${
                                    selectedVisitor.isPriority 
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-amber-500/30 border border-transparent' 
                                    : 'bg-white border-2 border-dashed border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                  <Star size={20} fill={selectedVisitor.isPriority ? "currentColor" : "none"} className={selectedVisitor.isPriority ? "text-white" : ""} /> 
                                  {selectedVisitor.isPriority ? 'VIP Status Active' : 'Mark as VIP Visitor'}
                              </button>
                              
                              <button 
                                onClick={handleServeSpecific}
                                className="py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 flex items-center justify-center gap-2"
                              >
                                  <Zap size={16} fill="currentColor" /> Serve Now
                              </button>
                              
                              <button 
                                onClick={() => handleRecall(selectedVisitor.id)}
                                className="py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                              >
                                  <Bell size={16} /> Alert
                              </button>
                          </div>

                          <button 
                            onClick={handleRemoveSpecific}
                            className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                              <Trash2 size={16} /> Remove from Queue
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
          {showQrModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center"
                  >
                      <h3 className="text-xl font-bold mb-4">Scan to Join</h3>
                      {/* Reduced Visual Size Container */}
                      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mb-6 w-52 flex items-center justify-center mx-auto overflow-hidden">
                          <canvas ref={canvasRef} className="w-full h-auto object-contain rounded-lg" />
                      </div>
                      <div className="flex gap-2 w-full">
                          <button onClick={handleDownloadQR} className="flex-1 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2">
                              <Download size={18} /> Download
                          </button>
                          <button onClick={() => setShowQrModal(false)} className="py-3 px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800">
                              Done
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Add Visitor Modal */}
      <AnimatePresence>
          {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full"
                  >
                      <h3 className="text-xl font-bold mb-4">Add Visitor Manually</h3>
                      <form onSubmit={handleAddVisitor}>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Visitor Name" 
                            value={newVisitorName}
                            onChange={(e) => setNewVisitorName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-lg font-medium"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20">Add</button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

       {/* Call By Number Modal */}
       <AnimatePresence>
          {showCallModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-sm w-full"
                  >
                      <h3 className="text-xl font-bold mb-4">Call by Ticket Number</h3>
                      <form onSubmit={handleCallByNumber}>
                          <input 
                            autoFocus
                            type="number" 
                            placeholder="Enter Ticket #" 
                            value={callNumberInput}
                            onChange={(e) => setCallNumberInput(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-lg font-medium"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowCallModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20">Call</button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
          {showSettingsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
                  >
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold">Queue Settings</h3>
                          <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20} /></button>
                      </div>

                      <div className="space-y-6">
                          {/* Logo Upload */}
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Queue Logo</label>
                              <div className="flex items-center gap-4">
                                  <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                                      {logoPreview ? (
                                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                      ) : (
                                          <ImageIcon className="text-gray-300" />
                                      )}
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleLogoUpload}
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <p className="text-xs text-gray-500 mb-2">Upload a logo to appear on the customer view and QR code.</p>
                                      <button className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg relative overflow-hidden">
                                          Upload Image
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleLogoUpload}
                                          />
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="h-px bg-gray-100"></div>

                          {/* Sound Settings */}
                          <div>
                              <div className="flex items-center justify-between mb-4">
                                  <label className="block text-sm font-bold text-gray-700">Sound Notifications</label>
                                  <button 
                                      onClick={() => setSettings({...settings, soundEnabled: !settings.soundEnabled})}
                                      className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                  </button>
                              </div>
                              
                              {settings.soundEnabled && (
                                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sound Type</label>
                                          <div className="flex gap-2">
                                              {['beep', 'chime', 'alarm'].map((type) => (
                                                  <button 
                                                    key={type}
                                                    onClick={() => setSettings({...settings, soundType: type as any})}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${settings.soundType === type ? 'bg-white text-primary-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-200/50'}`}
                                                  >
                                                      {type}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                      
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Volume</label>
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={settings.soundVolume}
                                            onChange={(e) => setSettings({...settings, soundVolume: parseFloat(e.target.value)})}
                                            className="w-full accent-primary-600"
                                          />
                                      </div>
                                      
                                      <button 
                                        onClick={() => playPreview(settings.soundType, settings.soundVolume)}
                                        className="w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100"
                                      >
                                          <Play size={14} /> Preview Sound
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="mt-8">
                          <button 
                            onClick={handleSaveSettings}
                            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                          >
                              <Save size={18} /> Save Settings
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for individual list items to keep main render clean
interface VisitorListItemProps {
    visitor: Visitor; 
    queueData: QueueData; 
    onTogglePriority: () => void;
    onClick: () => void; 
    isDraggable?: boolean; 
}

const VisitorListItem: React.FC<VisitorListItemProps> = ({ visitor, queueData, onTogglePriority, onClick, isDraggable }) => (
    <div
        onClick={onClick}
        className={`p-4 flex items-center justify-between rounded-2xl mb-1 border transition-all cursor-pointer ${visitor.isPriority ? 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-200 shadow-sm' : 'bg-white border-transparent border-b-gray-50 last:border-b-0 hover:bg-blue-50/20'}`}
    >
        <div className="flex items-center gap-4">
             {isDraggable && (
                <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1" onClick={(e) => e.stopPropagation()}>
                    <GripVertical size={20} />
                </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md pointer-events-none transition-all ${visitor.isPriority ? 'bg-amber-400 text-white shadow-amber-400/30 ring-2 ring-amber-200' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                {String(visitor.ticketNumber).padStart(3, '0')}
            </div>
            <div className="pointer-events-none">
                <div className="flex items-center gap-2">
                    <p className={`font-bold ${visitor.isPriority ? 'text-amber-900' : 'text-gray-900'}`}>{visitor.name}</p>
                    {visitor.source === 'manual' && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            <UserPlus size={10} /> Manual
                        </div>
                    )}
                    {visitor.isPriority && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                            VIP
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Users size={12} /> Joined at {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>
        <div className="text-right flex items-center gap-4">
            <div className="pointer-events-none">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Wait</div>
                <div className="font-mono text-gray-600">
                    ~{Math.max(1, (visitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                </div>
            </div>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePriority();
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer relative z-10 ${visitor.isPriority ? 'text-amber-400 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'}`}
                title={visitor.isPriority ? "Remove VIP" : "Make VIP"}
            >
                <Star size={20} fill={visitor.isPriority ? "currentColor" : "none"} />
            </button>
        </div>
     </div>
);

export default QueueManager;
