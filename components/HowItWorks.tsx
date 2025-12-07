import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, Bell, CheckCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: QrCode,
    title: "Scan QR",
    desc: "Scan code to join"
  },
  {
    id: 2,
    icon: Smartphone,
    title: "Join",
    desc: "No app needed"
  },
  {
    id: 3,
    icon: Bell,
    title: "Wait",
    desc: "Get notified"
  },
  {
    id: 4,
    icon: CheckCircle,
    title: "Served",
    desc: "Arrive on time"
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-16 relative z-20">
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
            className="text-gray-500 text-base md:text-lg"
          >
            Get your queue up and running in minutes
          </motion.p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connecting Line - Desktop Only */}
          <div className="hidden lg:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-gray-100 z-0"></div>
          
          {/* Grid: 2 Columns on Mobile, 4 on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-12">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center group w-full bg-white p-2 rounded-2xl" 
              >
                {/* Number Badge */}
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary-600 text-white text-xs md:text-base font-bold flex items-center justify-center absolute -top-1 -right-1 lg:-top-4 lg:-right-4 lg:left-auto lg:right-auto lg:left-[60%] shadow-md border-2 border-white z-20">
                  {step.id}
                </div>

                {/* Icon Container */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-8 shadow-xl shadow-blue-500/10 transition-colors duration-300 relative z-10 border-2 md:border-4 border-white
                    ${index === 0 ? 'bg-blue-500 text-white' : ''}
                    ${index === 1 ? 'bg-sky-400 text-white' : ''}
                    ${index === 2 ? 'bg-teal-400 text-white' : ''}
                    ${index === 3 ? 'bg-emerald-400 text-white' : ''}
                  `}
                >
                  <step.icon size={24} className="md:w-9 md:h-9" />
                </motion.div>

                {/* Text Content */}
                <div className="bg-white relative z-10 px-1 w-full">
                  <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-tight text-xs md:text-sm px-1">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;