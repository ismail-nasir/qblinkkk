
import React, { useState, useEffect, useRef } from 'react';
import { User, QueueData, QueueInfo, Visitor, QueueSettings } from '../types';
import { queueService } from '../services/queue';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Image as ImageIcon, CheckCircle, RefreshCw, GripVertical, Settings, Volume2, Play, Save } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
// @ts-ignore
import QRCode from 'qrcode';

interface QueueManagerProps {
  user: User;
  queue: QueueInfo;
  onBack: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ user, queue, onBack }) => {
  const [queueData, setQueueData] = useState<QueueData>(queueService.getQueueData(queue.id));
  const [currentQueue, setCurrentQueue] = useState<QueueInfo>(queue);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
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

  // Poll for updates (in case multiple devices/customers are interacting)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(queueService.getQueueData(queue.id));
    }, 1000); // Increased frequency for "instant" feel
    return () => clearInterval(interval);
  }, [queue.id]);

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
    const dotSizeRatio = 0.8; // Larger dots for better readability
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

    // 4. Draw Modules (Dots)
    ctx.fillStyle = '#111827'; // Dark Gray/Black for dots
    
    // Calculate Logo Safe Zone
    const center = moduleCount / 2;
    const logoModules = Math.ceil(moduleCount * logoSizeRatio);
    const safeZoneStart = Math.floor(center - logoModules / 2);
    const safeZoneEnd = Math.ceil(center + logoModules / 2);

    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            // Skip center safe zone for logo
            if (row >= safeZoneStart && row < safeZoneEnd && col >= safeZoneStart && col < safeZoneEnd) {
                continue;
            }

            if (qrData.modules.get(row, col)) {
                // Determine if this is a finder pattern (the big squares)
                const isFinderPattern = 
                    (row < 7 && col < 7) || 
                    (row < 7 && col >= moduleCount - 7) || 
                    (row >= moduleCount - 7 && col < 7);

                if (isFinderPattern) {
                    // Draw Finder Pattern (Rounded Square style for premium look)
                    // We draw slightly larger than moduleSize to ensure they connect if needed
                    roundRect(
                        ctx,
                        padding + col * moduleSize,
                        padding + row * moduleSize,
                        moduleSize + 0.5,
                        moduleSize + 0.5,
                        moduleSize * 0.3 // Rounded corners for finder modules
                    );
                    ctx.fill();
                } else {
                    // Draw Rounded Dot
                    const x = padding + col * moduleSize + moduleSize / 2;
                    const y = padding + row * moduleSize + moduleSize / 2;
                    const radius = (moduleSize * dotSizeRatio) / 2;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // 5. Draw Logo
    if (logoPreview) {
        const img = new Image();
        img.src = logoPreview;
        img.onload = () => {
            const logoPxSize = qrSize * logoSizeRatio;
            const logoX = (qrSize - logoPxSize) / 2;
            const logoY = (qrSize - logoPxSize) / 2;

            // Draw white background circle/square behind logo for contrast
            ctx.fillStyle = '#FFFFFF';
            // Round rect background
            roundRect(ctx, logoX - 15, logoY - 15, logoPxSize + 30, logoPxSize + 30, 30);
            ctx.fill();

            // Draw Logo
            ctx.save();
            // Clip to rounded rect
            roundRect(ctx, logoX, logoY, logoPxSize, logoPxSize, 25);
            ctx.clip();
            ctx.drawImage(img, logoX, logoY, logoPxSize, logoPxSize);
            ctx.restore();
        };
    }
  };

  // Helper for rounded rectangles on canvas
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setLogoPreview(base64);
              // Update Queue Service
              const updated = queueService.updateQueue(user.id, queue.id, { logo: base64 });
              if (updated) setCurrentQueue(updated);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleSaveSettings = () => {
      const updated = queueService.updateQueue(user.id, queue.id, { settings });
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

  const handleCallNext = () => {
    const newData = queueService.callNext(queue.id);
    setQueueData(newData);
  };

  const handleCallByNumber = (e: React.FormEvent) => {
      e.preventDefault();
      const num = parseInt(callNumberInput);
      if (!isNaN(num)) {
          const newData = queueService.callByNumber(queue.id, num);
          setQueueData(newData);
          setShowCallModal(false);
          setCallNumberInput('');
      }
  };

  const handleAddVisitor = (e: React.FormEvent) => {
      e.preventDefault();
      queueService.joinQueue(queue.id, newVisitorName);
      setQueueData(queueService.getQueueData(queue.id)); // Refresh
      setNewVisitorName('');
      setShowAddModal(false);
  };

  const handleRemoveVisitors = () => {
      if (confirm("Are you sure you want to clear the entire waiting list?")) {
          const newData = queueService.clearQueue(queue.id);
          setQueueData(newData);
      }
  };

  const handleTakeBack = () => {
      const newData = queueService.takeBack(queue.id);
      setQueueData(newData);
  };
  
  const handleRecall = (visitorId: string) => {
      const newData = queueService.recallVisitor(queue.id, visitorId);
      setQueueData(newData);
  };

  const handleNotifyCurrent = () => {
      const currentVisitor = queueData.visitors.find(v => v.status === 'serving');
      if (currentVisitor) {
          const newData = queueService.triggerAlert(queue.id, currentVisitor.id);
          setQueueData(newData);
      }
  };

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
  const handleReorder = (newOrder: Visitor[]) => {
      // Reorder only works on the 'waiting' subset visually
      // We need to merge this back into the full list
      // 1. Get all non-waiting visitors (serving, served, cancelled)
      const otherVisitors = queueData.visitors.filter(v => v.status !== 'waiting');
      
      // 2. Combine (Preserve original structure, just update order of waiting)
      // Note: Reorder.Group gives us the new order of 'waitingVisitors'
      const fullNewList = [...otherVisitors, ...newOrder];
      
      // 3. Update Service
      const newData = queueService.reorderQueue(queue.id, fullNewList);
      setQueueData(newData);
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
                <h1 className="text-2xl font-bold text-gray-900">{currentQueue.name}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{currentQueue.code}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-sm text-green-600 font-bold">{currentQueue.status}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
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
                                className="p-4 flex items-center justify-between hover:bg-blue-50/20 rounded-2xl mb-1 border-b border-gray-50 last:border-0 transition-colors"
                             >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20">
                                        {String(visitor.ticketNumber).padStart(3, '0')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{visitor.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <Users size={12} /> Joined at {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Wait</div>
                                    <div className="font-mono text-gray-600">
                                        ~{Math.max(1, (visitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                                    </div>
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
                                className="p-4 flex items-center justify-between hover:bg-blue-50/40 bg-white rounded-2xl mb-1 border border-transparent hover:border-blue-100 shadow-sm transition-all cursor-grab active:cursor-grabbing"
                                whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)", zIndex: 50 }}
                             >
                                <div className="flex items-center gap-4">
                                    {/* Drag Handle */}
                                    <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20 pointer-events-none">
                                        {String(visitor.ticketNumber).padStart(3, '0')}
                                    </div>
                                    <div className="pointer-events-none">
                                        <p className="font-bold text-gray-900">{visitor.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <Users size={12} /> Joined at {new Date(visitor.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pointer-events-none">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Wait</div>
                                    <div className="font-mono text-gray-600">
                                        ~{Math.max(1, (visitor.ticketNumber - queueData.lastCalledNumber) * queueData.metrics.avgWaitTime)} min
                                    </div>
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
      
      {/* Recently Served List */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-50">
                 <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" /> Recently Served
                 </h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
                <AnimatePresence mode="popLayout" initial={false}>
                    {servedVisitors.length > 0 ? servedVisitors.map((visitor) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            key={visitor.id}
                            className="p-4 flex items-center justify-between hover:bg-green-50/20 rounded-2xl mb-1 border-b border-gray-50 last:border-0 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold text-md border border-green-200">
                                    {String(visitor.ticketNumber).padStart(3, '0')}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{visitor.name}</p>
                                    <div className="text-xs text-gray-400">
                                        Served at {visitor.servedTime ? new Date(visitor.servedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Recall Button */}
                            <button 
                                onClick={() => handleRecall(visitor.id)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all flex items-center gap-1.5 font-bold text-xs"
                                title="Recall Visitor"
                            >
                                <RefreshCw size={16} /> <span className="hidden sm:inline">Recall</span>
                            </button>
                        </motion.div>
                    )) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="p-8 text-center text-gray-400 text-sm"
                        >
                            No served visitors yet.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
      </div>

      {/* MODALS */}

      {/* Settings Modal */}
      <AnimatePresence>
          {showSettingsModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                   <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full"
                  >
                      <div className="flex items-center justify-between mb-6">
                           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                               <Settings size={20} className="text-gray-500" /> Queue Settings
                           </h3>
                           <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                               <X size={20} />
                           </button>
                      </div>

                      <div className="space-y-6">
                          {/* Sound Toggle */}
                          <div className="flex items-center justify-between">
                              <div>
                                  <label className="font-bold text-gray-800 block">Alert Sound</label>
                                  <span className="text-xs text-gray-500">Play sound on customer device</span>
                              </div>
                              <button 
                                  onClick={() => setSettings({...settings, soundEnabled: !settings.soundEnabled})}
                                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}
                              >
                                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
                              </button>
                          </div>

                          {settings.soundEnabled && (
                            <div className="space-y-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {/* Sound Type */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Alert Style</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['beep', 'chime', 'alarm'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setSettings({...settings, soundType: type as any});
                                                    playPreview(type, settings.soundVolume);
                                                }}
                                                className={`py-2 text-sm font-bold rounded-lg border transition-all capitalize ${
                                                    settings.soundType === type 
                                                    ? 'bg-white border-primary-600 text-primary-600 shadow-sm' 
                                                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-200/50'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Volume Slider */}
                                <div>
                                     <div className="flex items-center justify-between mb-2">
                                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Volume Level</label>
                                         <span className="text-xs font-mono text-gray-500">{Math.round(settings.soundVolume * 100)}%</span>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <Volume2 size={16} className="text-gray-400" />
                                         <input 
                                            type="range" 
                                            min="0.1" 
                                            max="1.0" 
                                            step="0.1"
                                            value={settings.soundVolume}
                                            onChange={(e) => setSettings({...settings, soundVolume: parseFloat(e.target.value)})}
                                            onMouseUp={() => playPreview(settings.soundType, settings.soundVolume)}
                                            onTouchEnd={() => playPreview(settings.soundType, settings.soundVolume)}
                                            className="w-full accent-primary-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                         />
                                         <button
                                            onClick={() => playPreview(settings.soundType, settings.soundVolume)} 
                                            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-600 shadow-sm"
                                            title="Test Sound"
                                         >
                                            <Play size={14} fill="currentColor" />
                                         </button>
                                     </div>
                                </div>
                            </div>
                          )}
                      </div>

                      <button 
                          onClick={handleSaveSettings}
                          className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold mt-8 shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> Save Settings
                      </button>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
      
      {/* QR Modal (Premium Design with Logo Upload) */}
      <AnimatePresence>
          {showQrModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-sm"
                  >
                      {/* Close Button */}
                      <button 
                        onClick={() => setShowQrModal(false)}
                        className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
                      >
                          <X size={24} />
                      </button>

                      {/* Placard Container */}
                      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-1 rounded-[36px] shadow-2xl shadow-primary-900/50">
                           <div className="bg-white rounded-[34px] overflow-hidden flex flex-col items-center">
                               {/* Placard Header - Redesigned for Prominence */}
                               <div className="w-full bg-gray-50 border-b border-gray-100 p-6 pb-6 text-center relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500"></div>
                                   
                                   {/* Logo & Brand */}
                                   <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                                       <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white">
                                           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                               <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                           </svg>
                                       </div>
                                       <span className="font-bold text-gray-500 tracking-tight text-xs uppercase">Powered by Qblink</span>
                                   </div>
                                   
                                   <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight tracking-tight">{currentQueue.name}</h3>
                                   
                                   {/* Prominent Code Badge */}
                                   <div className="inline-flex flex-col items-center bg-gray-900 text-white px-6 py-2 rounded-xl shadow-lg transform scale-110 mt-1">
                                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Queue Code</span>
                                       <span className="text-3xl font-mono font-bold tracking-widest">{currentQueue.code}</span>
                                   </div>
                               </div>

                               {/* QR Area with Custom Canvas */}
                               <div className="p-8 pb-4 relative flex flex-col items-center">
                                    <div className="border-4 border-gray-900 rounded-3xl p-3 bg-white shadow-lg relative">
                                        {/* Canvas that renders the Dot QR with embedded logo */}
                                        <canvas 
                                            ref={canvasRef} 
                                            className="w-48 h-48 rounded-lg"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                        
                                        {/* Logo Upload Overlay Button */}
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-3 -right-3 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 hover:scale-105 transition-all z-20"
                                            title="Upload Logo"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mt-4">Scan to Join Queue</p>
                                    <p className="text-xs text-gray-400 mt-1">No app download required</p>
                               </div>

                               {/* Placard Footer */}
                               <div className="w-full p-6 pt-2 text-center pb-8">
                                   <button 
                                        onClick={handleDownloadQR}
                                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                   >
                                       <Download size={18} /> Download Placard
                                   </button>
                               </div>
                           </div>
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
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full"
                  >
                      <h3 className="text-lg font-bold mb-4">Add Visitor Manually</h3>
                      <form onSubmit={handleAddVisitor}>
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Visitor Name (Optional)" 
                            value={newVisitorName}
                            onChange={(e) => setNewVisitorName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Add</button>
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
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full"
                  >
                      <h3 className="text-lg font-bold mb-4">Call Specific Number</h3>
                      <form onSubmit={handleCallByNumber}>
                          <input 
                            autoFocus
                            type="number" 
                            placeholder="Ticket Number (e.g. 5)" 
                            value={callNumberInput}
                            onChange={(e) => setCallNumberInput(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-center text-xl font-bold"
                          />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowCallModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Call</button>
                          </div>
                      </form>
                  </motion.div>
               </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default QueueManager;
