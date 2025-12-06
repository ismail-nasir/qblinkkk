import React, { useState, useEffect } from 'react';
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
     // waiting count doesn't drop because they weren't served? Or maybe it does. Let's say it does.
     setQueueMetrics(prev => ({ ...prev, waiting: Math.max(0, prev.waiting - 1) }));
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
             <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
             <span className="font-bold text-xl tracking-tight">Q-Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-500">Logged in as <strong>Main Clinic</strong></span>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/100/100" alt="Avatar" />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Control Center</h1>
            <p className="text-gray-500">Manage your flow in real-time.</p>
          </div>
          
          {/* AI Insight Button */}
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAi}
            className="flex items-center gap-2 px-5 py-3 bg-white/80 border border-indigo-100 text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <Sparkles size={18} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Analyzing Flow..." : "Get AI Insight"}
          </button>
        </div>

        {/* AI Insight Result Card */}
        {aiInsight && (
            <div className="mb-8 animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[24px] p-1 shadow-lg">
                    <div className="bg-white/95 backdrop-blur-sm rounded-[22px] p-6 flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Sparkles size={24} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">Q-Flow Assistant</h4>
                            <p className="text-gray-600 text-lg leading-relaxed">"{aiInsight}"</p>
                        </div>
                        <button onClick={() => setAiInsight(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Action Card (Left Column) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <GlassCard className="p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
               {/* Background decoration */}
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
               
               <h3 className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-8">Now Serving</h3>
               <div className="text-[120px] md:text-[160px] leading-none font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-400 tracking-tighter drop-shadow-sm">
                 {currentTicket.toString().padStart(3, '0')}
               </div>
               
               <div className="mt-12 w-full max-w-md flex flex-col gap-4">
                 <button 
                    onClick={handleCallNext}
                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                 >
                    Call Next Customer <ArrowRight size={24} />
                 </button>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => {}} 
                        className="py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCw size={18} /> Recall
                    </button>
                    <button 
                        onClick={handleSkip}
                        className="py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <SkipForward size={18} /> Mark No Show
                    </button>
                 </div>
               </div>
            </GlassCard>
          </div>

          {/* Stats Column (Right Column) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
             {/* Queue Status */}
             <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-gray-900">Queue Status</h3>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">
                        Live
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Waiting</p>
                                <p className="text-2xl font-bold text-gray-900">{queueMetrics.waiting}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
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
             <GlassCard className="p-8 flex-1">
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                 <div className="space-y-4">
                    {[1,2,3].map((i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
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