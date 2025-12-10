
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, QueueData, QueueInfo, Visitor, QueueSettings } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Image as ImageIcon, CheckCircle, RefreshCw, GripVertical, Settings, Volume2, Play, Save, PauseCircle, PlayCircle, Megaphone, Star } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';

interface QueueManagerProps {
  user: User;
  queue: QueueInfo;
  onBack: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user, queue, onBack }) => {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentQueue, setCurrentQueue] = useState<QueueInfo>(queue);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(queue.announcement || '');
  const [showCallModal, setShowCallModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Settings State
  const [settings, setSettings] = useState<QueueSettings>(currentQueue.settings || {
      soundEnabled: true,
      soundVolume: 1.0,
      soundType: 'beep'
  });

  // QR Generation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    socketService.on('queue:update', (data: any) => {
        // Optimistic update or refetch
        fetchData();
    });

    socketService.on('customer_response', (data: any) => {
        // Customer acknowledged alert
        fetchData();
    });

    return () => {
        socketService.off('queue:update');
        socketService.off('customer_response');
    };
  }, [fetchData, queue.id]);

  const playPreview = (type: string, vol: number) => {
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
  };

  // QR Code Rendering Logic (Advanced Dot Style with Logo)
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

    const joinUrl = `${window.location.origin}?view=customer&queueId=${queue.id}`;
    const qrSize = 1000; // High resolution for download
    const padding = 60;
    const dotSizeRatio = 0.85; // Size of dots (0-1)
    const logoSizeRatio = 0.22; // Size of logo relative to QR

    // 1. Generate Raw QR Data
    const qrData = QRCode.create(joinUrl, { errorCorrectionLevel: 'H' });
    const moduleCount = qrData.modules.size;
    const moduleSize = (qrSize - 2 * padding) / moduleCount;

    // 2. Set Canvas Size
    canvas.width = qrSize;
    canvas.height = qrSize;

    // 3. Clear Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, qrSize, qrSize);

    // 4. Helper Function for Paths
    const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    // 5. Draw Custom Finder Patterns (The 3 big squares)
    const drawFinderPattern = (row: number, col: number) => {
        const x = padding + col * moduleSize;
        const y = padding + row * moduleSize;
        
        ctx.fillStyle = '#111827';
        
        // Outer Ring (7x7 modules)
        ctx.beginPath();
        roundRectPath(ctx, x, y, moduleSize * 7, moduleSize * 7, moduleSize * 2); 
        // Inner Ring Hole (5x5 modules) - Cutout
        roundRectPath(ctx, x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5, moduleSize * 1.5);
        ctx.fill('evenodd');

        // Inner Solid Square (3x3 modules)
        ctx.beginPath();
        roundRectPath(ctx, x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3, moduleSize);
        ctx.fill();
    };

    // Calculate Safe Zones
    const center = moduleCount / 2;
    const logoModules = Math.ceil(moduleCount * logoSizeRatio);
    const safeZoneStart = Math.floor(center - logoModules / 2);
    const safeZoneEnd = Math.ceil(center + logoModules / 2);

    // 6. Draw Data Modules (Dots)
    ctx.fillStyle = '#111827'; 
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            // Skip Logo Zone
            if (row >= safeZoneStart && row < safeZoneEnd && col >= safeZoneStart && col < safeZoneEnd) {
                continue;
            }

            // Skip Finder Pattern Zones (Top-Left, Top-Right, Bottom-Left)
            if ((row < 7 && col < 7) || (row < 7 && col >= moduleCount - 7) || (row >= moduleCount - 7 && col < 7)) {
                continue;
            }

            if (qrData.modules.get(row, col)) {
                const x = padding + col * moduleSize + moduleSize / 2;
                const y = padding + row * moduleSize + moduleSize / 2;
                const radius = (moduleSize * dotSizeRatio) / 2;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 7. Draw Finder Patterns manually at corners
    drawFinderPattern(0, 0); // Top Left
    drawFinderPattern(0, moduleCount - 7); // Top Right
    drawFinderPattern(moduleCount - 7, 0); // Bottom Left

    // 8. Draw Logo
    if (logoPreview) {
        const img = new Image();
        img.src = logoPreview;
        img.onload = () => {
            const logoPxSize = qrSize * logoSizeRatio;
            const logoX = (qrSize - logoPxSize) / 2;
            const logoY = (qrSize - logoPxSize) / 2;

            // Draw white background plate
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            roundRectPath(ctx, logoX - 15, logoY - 15, logoPxSize + 30, logoPxSize + 30, 30);
            ctx.fill();

            // Draw Logo
            ctx.save();
            ctx.beginPath();
            roundRectPath(ctx, logoX, logoY, logoPxSize, logoPxSize, 25);
            ctx.clip();
            ctx.drawImage(img, logoX, logoY, logoPxSize, logoPxSize);
            ctx.restore();
        };
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setLogoPreview(base64);
              // Update Queue Service
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
      // Pass 'manual' as the source
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
      await queueService.togglePriority(queue.id, visitorId, !isPriority);
      fetchData();
  };

  if (!queueData) return <div>Loading...</div>;

  const waitingVisitors = queueData.visitors.filter(v => 
      v.status === 'waiting' && 
      (v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.ticketNumber.toString().includes(searchQuery))
  );

  const servedVisitors = queueData.visitors
    .filter(v => v.status === 'served')
    .sort((a, b) => {
        if (a.servedTime && b.servedTime) {
            return new Date(b.servedTime).getTime() - new Date(a.servedTime).getTime();
        }
        return b.ticketNumber - a.ticketNumber;
    })
    .slice(0, 10);

  const currentVisitor = queueData.visitors.find(v => v.status === 'serving');

  // Handle Drag Reorder
  const handleReorder = async (newOrder: Visitor[]) => {
      const otherVisitors = queueData.visitors.filter(v => v.status !== 'waiting');
      const fullNewList = [...otherVisitors, ...newOrder];
      await queueService.reorderQueue(queue.id, fullNewList);
      fetchData();
  };
  
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
                    
                    {/* Pause/Resume Toggle */}
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

      {/* Main Status Card */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-6 md:p-8 text-center border border-white shadow-soft mb-8 relative overflow-hidden">
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

          {/* Current Visitor Name (if active) */}
          {currentVisitor && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-800 rounded-full text-sm font-bold max-w-full truncate"
              >
                  <span className="truncate">Serving: {currentVisitor.name}</span>
              </motion.div>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-600 font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
              There are <span className="text-blue-600 font-bold">{queueData.metrics.waiting}</span> visitors waiting
          </div>

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
                title="Notify Current Visitor (Buzz)"
              >
                  <Bell size={24} fill={currentVisitor?.isAlerting ? "currentColor" : "none"} />
              </button>
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
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">Waiting List</h3>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{queueData.metrics.waiting} Total</span>
                  {!searchQuery && waitingVisitors.length > 1 && (
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 font-medium">
                          <GripVertical size={12} /> Drag to reorder
                      </span>
                  )}
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
              {waitingVisitors.length > 0 ? (
                  searchQuery ? (
                    // Standard list when searching (Drag disabled)
                     <div>
                        {waitingVisitors.map((visitor) => (
                             <div
                                key={visitor.id}
                                className={`p-4 flex items-center justify-between rounded-2xl mb-1 border-b border-gray-50 last:border-0 transition-colors ${visitor.isPriority ? 'bg-amber-50 hover:bg-amber-100/50' : 'hover:bg-blue-50/20'}`}
                             >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${visitor.isPriority ? 'bg-amber-400 text-white shadow-amber-400/30 ring-2 ring-amber-200' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                                        {String(visitor.ticketNumber).padStart(3, '0')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold ${visitor.isPriority ? 'text-amber-900' : 'text-gray-900'}`}>{visitor.name}</p>
                                            {visitor.source === 'manual' && (
                                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200" title="Added manually">
                                                    <UserPlus size={10} /> Manual
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <Users size={12} /> Joined at {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Wait</div>
                                        <div className="font-mono text-gray-600">
                                            ~{Math.max(1, (visitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTogglePriority(visitor.id, !!visitor.isPriority);
                                        }}
                                        className={`p-2 rounded-full transition-colors ${visitor.isPriority ? 'text-amber-400 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'}`}
                                        title="Toggle VIP"
                                    >
                                        <Star size={20} fill={visitor.isPriority ? "currentColor" : "none"} />
                                    </button>
                                </div>
                             </div>
                        ))}
                     </div>
                  ) : (
                    // Reorderable list when not searching
                    <Reorder.Group axis="y" values={waitingVisitors} onReorder={handleReorder}>
                        {waitingVisitors.map((visitor) => (
                             <Reorder.Item 
                                key={visitor.id} 
                                value={visitor}
                                className={`p-4 flex items-center justify-between rounded-2xl mb-1 border border-transparent shadow-sm transition-all cursor-grab active:cursor-grabbing ${visitor.isPriority ? 'bg-gradient-to-r from-amber-50 to-white hover:border-amber-200' : 'bg-white hover:bg-blue-50/40 hover:border-blue-100'}`}
                                whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)", zIndex: 50 }}
                             >
                                <div className="flex items-center gap-4">
                                    {/* Drag Handle */}
                                    <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md pointer-events-none ${visitor.isPriority ? 'bg-amber-400 text-white shadow-amber-400/30 ring-2 ring-amber-200' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
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
                                            e.stopPropagation(); // Prevent drag start? ReorderItem handles this well usually
                                        }}
                                        onMouseDown={(e) => {
                                             e.stopPropagation(); // Stop drag event propagation
                                             handleTogglePriority(visitor.id, !!visitor.isPriority);
                                        }}
                                        className={`p-2 rounded-full transition-colors cursor-pointer relative z-10 ${visitor.isPriority ? 'text-amber-400 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'}`}
                                        title="Toggle VIP"
                                    >
                                        <Star size={20} fill={visitor.isPriority ? "currentColor" : "none"} />
                                    </button>
                                </div>
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
      
      {/* Recently Served List - unchanged... */}
      {/* ... (Rest of component) ... */}
      
      {/* MODALS - unchanged... */}
    </div>
  );
};

export default QueueManager;
