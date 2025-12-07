import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
                <span className="text-2xl font-bold text-gray-900">Qlink</span>
            </div>
            
            <button 
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-600 font-medium shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors w-fit"
            >
                <ArrowLeft size={18} /> Back to Home
            </button>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
                <p className="text-gray-500 font-medium">Last updated: 2025</p>
            </div>

            <GlassCard className="p-8 md:p-10">
                <p className="text-lg md:text-xl font-medium text-gray-800">
                    Qlink respects your privacy. We collect the minimum amount of information required to operate the service.
                </p>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Information We Collect</h2>
                <ul className="space-y-3 pl-5 list-disc text-gray-600 text-lg">
                    <li>Queue data you create</li>
                    <li>Basic usage analytics</li>
                    <li>Messages submitted through the contact form</li>
                </ul>
                <p className="text-gray-600 pt-2">
                    We do not collect personal information from customers joining queues. Everything is anonymous.
                </p>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How We Use Data</h2>
                <ul className="space-y-3 pl-5 list-disc text-gray-600 text-lg">
                    <li>To operate and improve Qlink</li>
                    <li>To ensure real-time queue functionality</li>
                    <li>To respond to support requests</li>
                </ul>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Advertising</h2>
                <p className="text-gray-600 text-lg">
                    Qlink displays ads in fixed locations. Ads do not track users across websites.
                </p>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Security</h2>
                <p className="text-gray-600 text-lg">
                    All communication is encrypted. We never sell user data.
                </p>
            </GlassCard>

            <div className="bg-blue-100/50 rounded-[32px] p-8 md:p-10 border border-blue-200 text-center">
                <p className="text-lg md:text-xl text-gray-800 font-medium">
                    If you have concerns, contact: <a href="mailto:ismailnsm75@gmail.com" className="text-primary-600 hover:underline">ismailnsm75@gmail.com</a>
                </p>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;