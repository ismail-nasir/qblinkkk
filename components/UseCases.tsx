import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Stethoscope, Scissors, Wrench, GraduationCap, Calendar } from 'lucide-react';

const cases = [
  { icon: Utensils, title: "Restaurants", desc: "Reduce walkouts" },
  { icon: Stethoscope, title: "Healthcare", desc: "Better flow" },
  { icon: Scissors, title: "Salons", desc: "Efficient bookings" },
  { icon: Wrench, title: "Services", desc: "Easy check-ins" },
  { icon: GraduationCap, title: "Schools", desc: "Student services" },
  { icon: Calendar, title: "Events", desc: "Smooth entry" },
];

const UseCases: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Built For You
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-500 text-base md:text-lg"
          >
            No matter your industry, Qblink delivers results
          </motion.p>
        </div>

        {/* 2 Columns on Mobile, 3 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {cases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 bg-white hover:border-primary-100 hover:bg-blue-50/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 h-full cursor-default group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 text-primary-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary-600 group-hover:text-white">
                <item.icon size={20} className="md:w-7 md:h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;