import React from 'react';
import { motion as m } from 'framer-motion';
import { Utensils, Stethoscope, Scissors, ShoppingBag, GraduationCap, Calendar } from 'lucide-react';

const motion = m as any;

const industries = [
  { icon: Utensils, label: "Restaurants" },
  { icon: Stethoscope, label: "Clinics" },
  { icon: Scissors, label: "Salons" },
  { icon: ShoppingBag, label: "Shops" },
  { icon: GraduationCap, label: "Schools" },
  { icon: Calendar, label: "Events" },
];

const TrustedBy: React.FC = () => {
  return (
    <section className="py-12 border-y border-gray-100 bg-white">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-8">Trusted by 500+ Businesses</p>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {industries.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 group cursor-default"
            >
              <item.icon className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
              <span className="font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;