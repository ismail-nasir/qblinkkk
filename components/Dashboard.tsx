import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { Users, Clock, ArrowRight, Sparkles, X, RotateCw, SkipForward } from 'lucide-react';
import { getQueueInsights } from '../services/geminiService';
import { QueueMetric } from '../types';

interface DashboardProps {
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [currentTicket, setCurrentTicket] = useState(42);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetric>({
    waiting: 8,
    served: 145,
    avgWaitTime: 12
  });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Generate Insight Handler
  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const insight = await getQueueInsights(queueMetrics);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const handleCallNext = () => {
    setCurrentTicket(prev => prev + 1);
    setQueueMetrics(prev => ({
      ...prev,
      waiting: Math.max(0, prev.waiting - 1),
      served: prev.served + 1
    }));
    // Reset insight on state change to encourage re-checking
    if (aiInsight) setAiInsight(null);
  };

  const handleSkip = () => {
     setCurrentTicket(prev => prev + 1);
     setQueueMetrics(prev => ({ ...prev, waiting: Math.max(0, prev.waiting - 1) }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fade-in">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100/50 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
             <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
             </div>
             <span className="font-bold text-xl tracking-tight text-gray-900">Qblink</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-500">Logged in as <strong>Main Clinic</strong></span>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform">
                <img src="https://picsum.photos/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
          <div className="animate-fade-in-up w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Control Center</h1>
            <p className="text-gray-500">Manage your flow in real-time.</p>
          </div>
          
          {/* AI Insight Button - Full width on mobile */}
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAi}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white/80 border border-primary-100 text-primary-600 rounded-2xl shadow-sm hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 animate-fade-in-up animation-delay-100 font-semibold"
          >
            <Sparkles size={18} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Analyzing Flow..." : "Get AI Insight"}
          </button>
        </div>

        {/* AI Insight Result Card */}
        {aiInsight && (
            <div className="mb-8 animate-pop-in">
                <div className="bg-gradient-to-r from-primary-500 to-cyan-500 rounded-[24px] p-1 shadow-lg">
                    <div className="bg-white/95 backdrop-blur-sm rounded-[22px] p-4 md:p-6 flex items-start gap-4">
                        <div className="hidden sm:block p-3 bg-primary-100 rounded-xl animate-pulse">
                            <Sparkles size={24} className="text-primary-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                              <span className="sm:hidden text-primary-500"><Sparkles size={16} /></span>
                              Qblink Assistant
                            </h4>
                            <p className="text-gray-600 text-base md:text-lg leading-relaxed">"{aiInsight}"</p>
                        </div>
                        <button onClick={() => setAiInsight(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Main Action Card (Left Column) */}
          <div className="lg:col-span-7 flex flex-col gap-6 animate-fade-in-up animation-delay-200">
            <GlassCard className="p-6 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px] md:min-h-[400px]">
               {/* Background decoration */}
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-cyan-500 to-primary-500"></div>
               
               <h3 className="text-gray-400 uppercase tracking-widest text-xs md:text-sm font-bold mb-4 md:mb-8">Now Serving</h3>
               
               {/* Animated Number */}
               <div key={currentTicket} className="text-8xl sm:text-9xl md:text-[160px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-cyan-500 tracking-tighter drop-shadow-sm animate-pop-in py-2">
                 {currentTicket.toString().padStart(3, '0')}
               </div>
               
               <div className="mt-8 md:mt-12 w-full max-w-md flex flex-col gap-4">
                 <button 
                    onClick={handleCallNext}
                    className="group w-full py-5 md:py-6 bg-gradient-to-r from-primary-600 to-cyan-500 text-white rounded-2xl text-lg md:text-xl font-bold shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 overflow-hidden relative"
                 >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                    <span className="relative z-10 flex items-center gap-3">Call Next <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></span>
                 </button>
                 
                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button 
                        onClick={() => {}} 
                        className="py-3 md:py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-semibold text-sm md:text-base hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RotateCw size={16} /> Recall
                    </button>
                    <button 
                        onClick={handleSkip}
                        className="py-3 md:py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-semibold text-sm md:text-base hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <SkipForward size={16} /> No Show
                    </button>
                 </div>
               </div>
            </GlassCard>
          </div>

          {/* Stats Column (Right Column) */}
          <div className="lg:col-span-5 flex flex-col gap-6 animate-fade-in-up animation-delay-300">
             {/* Queue Status */}
             <GlassCard className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Queue Status</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live
                    </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Waiting</p>
                                <p key={queueMetrics.waiting} className="text-2xl font-bold text-gray-900 animate-pop-in">{queueMetrics.waiting}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Avg Wait Time</p>
                                <p className="text-2xl font-bold text-gray-900">{queueMetrics.avgWaitTime} <span className="text-sm font-normal text-gray-400">mins</span></p>
                            </div>
                        </div>
                    </div>
                </div>
             </GlassCard>

             {/* Recent Activity Mini-List */}
             <GlassCard className="p-6 md:p-8 flex-1">
                 <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Recent Activity</h3>
                 <div className="space-y-4">
                    {[1,2,3].map((i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-gray-600">Ticket #{currentTicket - i} completed</span>
                            </div>
                            <span className="text-gray-400 text-xs">{i * 5}m ago</span>
                        </div>
                    ))}
                 </div>
             </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;