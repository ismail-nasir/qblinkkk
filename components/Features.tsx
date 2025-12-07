import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Zap, Bell, Clock, Users, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    color: "bg-blue-500",
    title: "QR Entry",
    desc: "No app, no account."
  },
  {
    icon: Zap,
    color: "bg-sky-400",
    title: "Instant Setup",
    desc: "Queue up in 30s."
  },
  {
    icon: Bell,
    color: "bg-teal-400",
    title: "Notifications",
    desc: "Alerts via browser."
  },
  {
    icon: Clock,
    color: "bg-emerald-400",
    title: "Wait Times",
    desc: "AI-powered estimates."
  },
  {
    icon: Users,
    color: "bg-green-500",
    title: "Multi-Queue",
    desc: "Manage from one dashboard."
  },
  {
    icon: ShieldCheck,
    color: "bg-orange-400",
    title: "Forever Free",
    desc: "No hidden costs."
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-16">
          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Everything You Need
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-base md:text-lg"
          >
            Powerful features that make queue management effortless
          </motion.p>
        </div>

        {/* 2 Columns on Mobile, 3 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-[20px] md:rounded-[32px] p-4 md:p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 border border-transparent hover:border-blue-100 flex flex-col items-start"
            >
              <div className={`w-10 h-10 md:w-14 md:h-14 ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-3 md:mb-6 shadow-lg shadow-gray-200`}>
                <feature.icon size={20} className="md:w-7 md:h-7" />
              </div>
              <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{feature.title}</h3>
              <p className="text-xs md:text-base text-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;