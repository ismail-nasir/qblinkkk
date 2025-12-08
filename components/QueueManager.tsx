

import React, { useState, useEffect, useRef } from 'react';
import { User, QueueData, Visitor, QueueInfo } from '../types';
import { queueService } from '../services/queue';
import { Phone, Users, UserPlus, Trash2, RotateCcw, QrCode, Share2, Download, Search, X, ArrowLeft, Bell, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [newVisitorName, setNewVisitorName] = useState('');
  const [callNumberInput, setCallNumberInput] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // QR Generation State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(queue.logo || null);

  // Poll for updates (in case multiple devices/customers are interacting)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(queueService.getQueueData(queue.id));
    }, 2000);
    return () => clearInterval(interval);
  }, [queue.id]);

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
    const dotSizeRatio = 0.75; // 0-1, size of dots relative to grid
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
                // Finder patterns are 7x7 at corners (0,0), (0, max), (max, 0)
                const isFinderPattern = 
                    (row < 7 && col < 7) || 
                    (row < 7 && col >= moduleCount - 7) || 
                    (row >= moduleCount - 7 && col < 7);

                if (isFinderPattern) {
                    // Draw Finder Pattern (Square block style)
                    // We can just draw a rect slightly larger to prevent gaps
                    ctx.fillRect(
                        padding + col * moduleSize,
                        padding + row * moduleSize,
                        moduleSize + 0.5,
                        moduleSize + 0.5
                    );
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
            roundRect(ctx, logoX - 10, logoY - 10, logoPxSize + 20, logoPxSize + 20, 20);
            ctx.fill();

            // Draw Logo
            ctx.save();
            // Clip to rounded rect
            roundRect(ctx, logoX, logoY, logoPxSize, logoPxSize, 15);
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

  const handleDownloadQR = () => {
      if (canvasRef.current) {
          const link = document.createElement('a');
          link.download = `qblink-qr-${queue.code}.png`;
          link.href = canvasRef.current.toDataURL('image/png');
          link.click();
      }
  };

  // ... (Existing Event Handlers: handleCallNext, handleAddVisitor, etc.)
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

  const currentVisitor = queueData.visitors.find(v => v.status === 'serving');
  
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
                <h1 className="text-2xl font-bold text-gray-900">{queue.name}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{queue.code}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-sm text-green-600 font-bold">{queue.status}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowQrModal(true)}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2"
            >
                <QrCode size={20} /> <span className="md:hidden font-bold text-sm">QR Code</span>
            </button>
             <button 
                onClick={() => window.open(`${window.location.origin}?view=display&queueId=${queue.id}`, '_blank')}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2"
                title="Open Display Screen"
            >
                <Share2 size={20} /> <span className="md:hidden font-bold text-sm">Display</span>
            </button>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-[32px] p-8 text-center border border-white shadow-soft mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <p className="text-gray-500 font-medium mb-4 uppercase tracking-widest text-xs">Last called visitor number</p>
          
          <motion.div 
            key={queueData.lastCalledNumber}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[120px] leading-none font-black text-gray-900 mb-6 tracking-tighter"
          >
              {String(queueData.lastCalledNumber).padStart(3, '0')}
          </motion.div>

          {/* Current Visitor Name (if active) */}
          {currentVisitor && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-800 rounded-full text-sm font-bold"
              >
                  <span>Currently Serving: {currentVisitor.name}</span>
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
                  Call next visitor <Phone size={20} />
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
              <span className="text-sm">Call by number</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <UserPlus size={20} className="text-gray-400" />
              <span className="text-sm">Add Visitor</span>
          </button>
          <button 
            onClick={handleRemoveVisitors}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-red-600 hover:bg-red-50 hover:border-red-100 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <Trash2 size={20} className="text-red-400" />
              <span className="text-sm">Remove visitors</span>
          </button>
          <button 
            onClick={handleTakeBack}
            className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex flex-col items-center gap-2 shadow-sm"
          >
              <RotateCcw size={20} className="text-gray-400" />
              <span className="text-sm">Take back</span>
          </button>
      </div>

      {/* Waiting List - Removed Border */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden">
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
          
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {waitingVisitors.length > 0 ? waitingVisitors.map((visitor) => (
                  <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
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
              )) : (
                  <div className="p-12 text-center text-gray-400">
                      {searchQuery ? "No visitors found matching your search." : "No visitors in the queue."}
                  </div>
              )}
          </div>
      </div>

      {/* MODALS */}
      
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
                               {/* Placard Header */}
                               <div className="w-full bg-gray-50 border-b border-gray-100 p-6 pb-8 text-center relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500"></div>
                                   <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-primary-100/50 rounded-full blur-xl"></div>
                                   
                                   <div className="flex items-center justify-center gap-2 mb-2">
                                       <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white">
                                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                               <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                           </svg>
                                       </div>
                                       <span className="font-bold text-gray-900 tracking-tight">Qblink</span>
                                   </div>
                                   
                                   <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{queue.name}</h3>
                                   <p className="text-gray-500 text-sm font-medium">Scan to join the queue</p>
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
                                    <p className="text-[10px] text-gray-400 font-medium mt-3">
                                        Click icon to add your logo
                                    </p>
                               </div>

                               {/* Placard Footer */}
                               <div className="w-full p-6 pt-2 text-center pb-8">
                                   <div className="bg-gray-50 rounded-xl py-3 px-4 border border-gray-100 mb-6">
                                       <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Queue Code</p>
                                       <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{queue.code}</p>
                                   </div>
                                   
                                   <button 
                                        onClick={handleDownloadQR}
                                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 hover:scale-105 transition-transform"
                                   >
                                       <Download size={18} /> Download Printable
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
