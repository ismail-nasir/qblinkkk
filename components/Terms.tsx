
import React, { useEffect } from 'react';
import { motion as m } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

const motion = m as any;

interface TermsProps {
  onBack: () => void;
}

const Terms: React.FC<TermsProps> = ({ onBack }) => {
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
                <span className="text-2xl font-bold text-gray-900">Qblink</span>
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
            <div className="mb-8">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">Terms & Conditions</h1>
                <p className="text-gray-500">Effective Date: January 1, 2025</p>
            </div>

            <GlassCard className="p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">
                
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                    <p>
                        Welcome to QBlink, a digital queue management platform (“the Platform”), owned and operated by Qblink.
                        By accessing or using the Platform, you agree to comply with these Terms & Conditions (“Terms”). If you do not agree with any part of these Terms, you must not use the Platform.
                        These Terms apply to all users, including businesses (“Business Users”) and customers (“Customers”).
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">2. Scope of Services</h2>
                    <p>QBlink provides the following services:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Digital queue management for businesses, allowing real-time customer management.</li>
                        <li>Customer access to queues via QR codes, notifications, and live updates.</li>
                        <li>Analytics and reporting tools for businesses.</li>
                    </ul>
                    <p className="mt-2">We reserve the right to modify, update, or discontinue any part of the Platform at any time without prior notice.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Eligibility</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Users must be at least 18 years old or have consent from a legal guardian.</li>
                        <li>Businesses must have the legal authority to operate in their jurisdiction.</li>
                        <li>Users agree to provide accurate and up-to-date information when registering or using the Platform.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">4. User Responsibilities</h2>
                    <h3 className="font-bold text-gray-800 mb-2">4.1 Customers</h3>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>Join queues only through the official Platform using valid QR codes.</li>
                        <li>Provide accurate personal information (e.g., name, phone number) and keep it updated.</li>
                        <li>Adhere to the queue instructions and estimated wait times.</li>
                    </ul>
                    <h3 className="font-bold text-gray-800 mb-2">4.2 Businesses</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Ensure that all information provided to the Platform is accurate and lawful.</li>
                        <li>Respect customer data and comply with local and international data protection laws.</li>
                        <li>Maintain operational integrity of their services and act responsibly.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">5. Account Security</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Users are responsible for keeping their account credentials secure.</li>
                        <li>Any activity through a user’s account is considered authorized by that user.</li>
                        <li>QBlink is not liable for any unauthorized access resulting from a user’s failure to secure their account.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Collection & Privacy</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The Platform collects minimal personal data necessary for service operation, such as names, phone numbers, and queue participation.</li>
                        <li>Personal data is processed according to our Privacy Policy.</li>
                        <li>We do not sell user data to third parties.</li>
                        <li>Users may request data access, correction, or deletion in compliance with local and global privacy regulations (e.g., GDPR, CCPA).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
                    <p>
                        The Platform, its content, design, software, and branding are the exclusive property of QBlink and its licensors.
                        Users may not copy, modify, distribute, or create derivative works from the Platform without prior written permission.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitation of Liability</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The Platform is provided “as is” and “as available,” without warranties of any kind.</li>
                        <li>QBlink is not liable for indirect, incidental, special, or consequential damages arising from the use or inability to use the Platform.</li>
                        <li>The Platform does not guarantee uninterrupted service or error-free operation.</li>
                        <li>Users use the Platform at their own risk.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">9. Indemnification</h2>
                    <p>
                        Users agree to indemnify, defend, and hold harmless QBlink and its affiliates from any claims, damages, liabilities, or expenses arising from misuse of the Platform or violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">10. Termination</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>QBlink may suspend or terminate a user’s access at any time for violations of these Terms or unlawful behavior.</li>
                        <li>Users may terminate their account at any time by following the account deletion procedure.</li>
                        <li>Termination does not absolve any pending obligations or liabilities.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>QBlink may update these Terms periodically.</li>
                        <li>Updated Terms take effect immediately upon posting on the Platform.</li>
                        <li>Continued use of the Platform indicates acceptance of the updated Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">12. Governing Law & Jurisdiction</h2>
                    <p>
                        These Terms are governed by the laws of International Standards and applicable local regulations.
                        Any disputes shall be resolved under international arbitration guidelines if cross-border, or through courts with appropriate jurisdiction for local disputes.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">13. Global Compliance Notes</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The Platform aims to comply with global data protection laws including GDPR (Europe), CCPA (California), and other applicable regulations.</li>
                        <li>Businesses are responsible for compliance with local consumer protection, labor, and privacy laws.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact</h2>
                    <p>For questions regarding these Terms, contact us at:</p>
                    <div className="mt-2 text-gray-900 font-medium">
                        <p>Email: hello@qblink.app</p>
                        <p>Website: qblink.app</p>
                    </div>
                </section>

            </GlassCard>

            <div className="bg-blue-50 p-8 md:p-10 rounded-[32px] border border-blue-100 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Acceptance
                </h3>
                <p className="text-gray-600">
                    By using Qblink, you acknowledge that you have read and understood these Terms & Conditions.
                </p>
            </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Terms;