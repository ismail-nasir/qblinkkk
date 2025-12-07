import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Stethoscope, Scissors, Wrench, GraduationCap, Calendar } from 'lucide-react';

const cases = [
  { icon: Utensils, title: "Restaurants & Cafés", desc: "Reduce walkouts by 40%" },
  { icon: Stethoscope, title: "Healthcare Clinics", desc: "Improve patient satisfaction" },
  { icon: Scissors, title: "Salons & Spas", desc: "Maximize booking efficiency" },
  { icon: Wrench, title: "Service Centers", desc: "Streamline check-ins" },
  { icon: GraduationCap, title: "Educational Institutions", desc: "Organize student services" },
  { icon: Calendar, title: "Events & Conferences", desc: "Manage registrations smoothly" },
];

const UseCases: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Built For Your Business
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-500 text-lg"
          >
            No matter your industry, Qblink delivers results
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-6 p-6 rounded-3xl border border-gray-100 hover:border-primary-100 hover:bg-blue-50/30 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-blue-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                <item.icon size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;