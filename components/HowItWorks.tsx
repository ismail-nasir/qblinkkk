import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, Bell, CheckCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: QrCode,
    title: "Scan QR Code",
    desc: "Customer scans the QR code displayed at your location"
  },
  {
    id: 2,
    icon: Smartphone,
    title: "Join Instantly",
    desc: "No app download needed - joins queue in seconds"
  },
  {
    id: 3,
    icon: Bell,
    title: "Get Notified",
    desc: "Real-time updates and notification when it's their turn"
  },
  {
    id: 4,
    icon: CheckCircle,
    title: "Get Served",
    desc: "Customer arrives right on time for their service"
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Simple as 1-2-3-4
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg"
          >
            Get your queue up and running in minutes
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line - Desktop Only */}
          <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-gray-100 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                {/* Number Badge */}
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center absolute -top-4 -right-4 lg:right-auto lg:left-[60%] shadow-md border-2 border-white z-20">
                  {step.id}
                </div>

                {/* Icon Container */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/10 transition-colors duration-300
                    ${index === 0 ? 'bg-blue-500 text-white' : ''}
                    ${index === 1 ? 'bg-sky-400 text-white' : ''}
                    ${index === 2 ? 'bg-teal-400 text-white' : ''}
                    ${index === 3 ? 'bg-emerald-400 text-white' : ''}
                  `}
                >
                  <step.icon size={36} />
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm px-2">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;