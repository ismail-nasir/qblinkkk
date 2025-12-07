import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

interface PricingProps {
  onGetStarted?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onGetStarted }) => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Simple Pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-500 text-lg"
          >
            One plan. Everything included. Forever free.
          </motion.p>
        </div>

        <div className="max-w-xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[48px] p-8 md:p-12 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden text-center"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-600 font-bold text-sm mb-6 uppercase tracking-wide">
              Ad-Supported
            </div>
            
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-7xl font-extrabold text-gray-900">$0</span>
            </div>
            <p className="text-gray-500 font-medium mb-10">Forever Free</p>

            <div className="space-y-4 mb-10 text-left max-w-xs mx-auto">
              {[
                "Unlimited queues",
                "Real-time updates",
                "QR code generation",
                "Customer notifications",
                "Analytics dashboard",
                "Multi-device support"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <motion.button 
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight size={20} />
            </motion.button>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;