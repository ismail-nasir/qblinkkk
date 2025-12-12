import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Cookie, Server, Globe } from 'lucide-react';
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
        {/* Header (spacing only, no logo/button because it overlaps with navbar) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12" />

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
                <p className="text-gray-500 font-medium">Last updated: January 2025</p>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-2xl">
                    Your privacy is critically important to us. At Qblink, we have a few fundamental principles regarding your data.
                </p>
            </div>

            {/* Core Privacy Principles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <GlassCard className="p-6 bg-blue-50/30 border-blue-100">
                    <Shield className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Data Minimization</h3>
                    <p className="text-sm text-gray-600">We only ask for personal information when we truly need it.</p>
                 </GlassCard>
                 <GlassCard className="p-6 bg-purple-50/30 border-purple-100">
                    <Lock className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Encryption</h3>
                    <p className="text-sm text-gray-600">Data is encrypted in transit and we use secure storage practices.</p>
                 </GlassCard>
                 <GlassCard className="p-6 bg-teal-50/30 border-teal-100">
                    <Eye className="w-8 h-8 text-teal-500 mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Transparency</h3>
                    <p className="text-sm text-gray-600">No hidden trackers. We are open about what we collect.</p>
                 </GlassCard>
            </div>

            <GlassCard className="p-8 md:p-10 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl hidden md:block">
                        <Server size={24} className="text-gray-600" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Information We Collect</h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                            <p>
                                <strong>For Queue Participants:</strong> We collect minimal data necessary to facilitate the queue. This may include a self-provided name (alias), your browser's user agent, and a temporary session ID. We do <strong>not</strong> require phone numbers or email addresses for basic usage.
                            </p>
                            <p>
                                <strong>For Business Owners:</strong> If you register to manage a queue, we collect your email address, business name, and password. This is used solely for account authentication and service management.
                            </p>
                            <p>
                                <strong>Log Data:</strong> Like most websites, we collect information that web browsers, mobile devices, and servers typically make available, such as the browser type, IP address, unique device identifiers, and date/time of access.
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl hidden md:block">
                        <Cookie size={24} className="text-gray-600" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cookies & Tracking</h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                             <p>
                                Qblink uses cookies and local storage to help us identify and track visitors, their usage of the website, and their website access preferences (e.g., keeping you in line without reloading).
                             </p>
                             <ul className="list-disc pl-5 space-y-2 text-base">
                                <li><strong>Essential Cookies:</strong> Required for the app to function (e.g., session tokens).</li>
                                <li><strong>Advertising Cookies:</strong> We use Google AdSense to support our free service. Google and its partners use cookies to serve ads based on your prior visits to this or other websites.</li>
                             </ul>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl hidden md:block">
                        <Globe size={24} className="text-gray-600" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Third-Party Services</h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                            <p>
                                We may share generic, aggregated demographic information not linked to any personal identification information with our business partners and advertisers.
                            </p>
                            <p>
                                <strong>Google AdSense:</strong> This service uses the DoubleClick cookie to serve more relevant ads across the web and limit the number of times a given ad is shown to you. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Ad Settings</a>.
                            </p>
                            <p>
                                <strong>Analytics:</strong> We may use third-party analytics tools to help us understand how our service is used, identifying trends to improve user experience.
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Data Retention & Deletion</h2>
                <p className="text-gray-600 text-lg">
                    We retain queue data only as long as the queue is active. Once a queue is closed or reset by the business owner, participant data associated with that specific session is typically deleted from our active database. Account information for business owners is retained until the account is deleted.
                </p>
                <p className="text-gray-600 text-lg">
                    You may request deletion of your data at any time by contacting us.
                </p>
            </GlassCard>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[32px] p-8 md:p-12 border border-blue-100 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                    Questions about your data?
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                    We are happy to answer any questions regarding our privacy practices.
                </p>
                <a 
                    href="mailto:ismailnsm75@gmail.com" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                    Contact Privacy Team
                </a>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;