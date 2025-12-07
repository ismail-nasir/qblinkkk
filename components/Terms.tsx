import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

interface TermsProps {
  onBack: () => void;
}

const Terms: React.FC<TermsProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const simpleTerms = [
    "Qlink is provided 'as-is' without guarantees.",
    "You must use Qlink responsibly and legally.",
    "You may not misuse or overload the system.",
    "You accept that ads are displayed in the free plan.",
    "Qlink can update features or rules at any time.",
    "All content and branding belong to Qlink."
  ];

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
            <div className="mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">Terms & Conditions</h1>
                <GlassCard className="p-6 md:p-8">
                    <p className="text-xl font-bold text-gray-800">By using Qlink, you agree to the following:</p>
                </GlassCard>
            </div>

            <div className="space-y-4">
                {simpleTerms.map((term, i) => (
                    <div key={i} className="bg-blue-50/50 p-4 md:p-6 rounded-2xl border-l-4 border-primary-500">
                        <p className="text-gray-700 font-medium">{term}</p>
                    </div>
                ))}
            </div>

            <GlassCard className="p-8 md:p-10 space-y-4 mt-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Google AdSense Compliance</h2>
                <p className="text-gray-600 mb-4">
                    This service uses Google AdSense to display advertisements. By using this service, you acknowledge and agree to Google's advertising policies and terms:
                </p>
                <ul className="space-y-3 pl-5 list-disc text-gray-600">
                    <li>Ads are provided by Google AdSense and are subject to Google's policies</li>
                    <li>Ad content is determined by Google and may be personalized based on your browsing</li>
                    <li>You may not click on ads for fraudulent purposes or encourage others to do so</li>
                    <li>You must not interfere with or manipulate the display or functionality of ads</li>
                    <li>Google may use cookies and similar technologies for ad serving and personalization</li>
                </ul>
                <p className="text-sm text-gray-500 mt-4">
                    For more information about Google's advertising policies, visit: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google AdSense Program Policies</a>
                </p>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">User Conduct</h2>
                <p className="text-gray-600 mb-4">You agree not to engage in any of the following prohibited activities:</p>
                <ul className="space-y-3 pl-5 list-disc text-gray-600">
                    <li>Attempting to manipulate, interfere with, or disrupt the service</li>
                    <li>Creating fake queues or customer entries</li>
                    <li>Using the service for any illegal or unauthorized purpose</li>
                    <li>Attempting to circumvent or interfere with the advertising system</li>
                    <li>Collecting or harvesting any personally identifiable information</li>
                </ul>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Limitation of Liability</h2>
                <p className="text-gray-600">
                    Qlink and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service, including but not limited to loss of revenue, loss of data, or service interruptions.
                </p>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Changes to Terms</h2>
                <p className="text-gray-600">
                    We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
            </GlassCard>

            <div className="bg-red-50 p-8 md:p-10 rounded-[32px] border border-red-100 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    If you disagree with these terms, please stop using the service.
                </h3>
            </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Terms;