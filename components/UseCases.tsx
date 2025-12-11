import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Stethoscope, Scissors, Wrench, GraduationCap, Calendar, MapPin, Clock, Star } from 'lucide-react';
import PhoneMockup from './PhoneMockup';

const cases = [
  { 
    id: 0,
    icon: Utensils, 
    title: "Restaurants", 
    desc: "Reduce walkouts & manage tables.",
    mockupData: {
      name: "City Bistro",
      status: "Table for 2",
      wait: "15 min",
      color: "bg-orange-500",
      accent: "text-orange-600",
      bg: "bg-orange-50"
    }
  },
  { 
    id: 1,
    icon: Stethoscope, 
    title: "Healthcare", 
    desc: "Better patient flow & privacy.",
    mockupData: {
      name: "Downtown Clinic",
      status: "Dr. Smith",
      wait: "30 min",
      color: "bg-blue-500",
      accent: "text-blue-600",
      bg: "bg-blue-50"
    }
  },
  { 
    id: 2,
    icon: Scissors, 
    title: "Salons", 
    desc: "Manage walk-ins seamlessly.",
    mockupData: {
      name: "Luxe Salon",
      status: "Haircut",
      wait: "10 min",
      color: "bg-pink-500",
      accent: "text-pink-600",
      bg: "bg-pink-50"
    }
  },
  { 
    id: 3,
    icon: GraduationCap, 
    title: "Education", 
    desc: "Student services simplified.",
    mockupData: {
      name: "Student Center",
      status: "Advising",
      wait: "45 min",
      color: "bg-emerald-500",
      accent: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  },
];

const UseCases: React.FC = () => {
  const [activeId, setActiveId] = useState(0);
  const activeCase = cases[activeId];

  return (
    <section className="py-12 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Built for <span className="text-primary-600">Every Business</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            See how Qblink adapts to your specific industry needs.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left: Interactive List */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 gap-4">
            {cases.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.id * 0.1 }}
                className={`flex items-center gap-6 p-6 rounded-3xl text-left transition-all duration-300 border-2 group ${
                  activeId === item.id 
                    ? 'bg-white border-primary-600 shadow-xl shadow-primary-600/10 scale-[1.02]' 
                    : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                   activeId === item.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 group-hover:text-primary-600'
                }`}>
                  <item.icon size={28} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 transition-colors ${activeId === item.id ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm transition-colors ${activeId === item.id ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: Dynamic Mockup */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-50 rounded-full blur-3xl -z-10 transform scale-90"></div>
             
             <PhoneMockup variant="right">
                <div key="mockup" className="h-full bg-gray-50 flex flex-col font-sans relative overflow-hidden">
                    {/* Dynamic Header */}
                    <motion.div 
                      key={activeCase.mockupData.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 pb-4 rounded-b-[32px] shadow-sm z-10"
                    >
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h3 className="text-xl font-bold text-gray-900">{activeCase.mockupData.name}</h3>
                                 <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                    <MapPin size={10} /> 123 Main St
                                 </div>
                             </div>
                             <div className={`w-10 h-10 rounded-full ${activeCase.mockupData.bg} ${activeCase.mockupData.accent} flex items-center justify-center`}>
                                <activeCase.icon size={20} />
                             </div>
                         </div>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 z-10">
                        <motion.div 
                          key={activeCase.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", damping: 20 }}
                          className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-white flex flex-col items-center relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 right-0 h-2 ${activeCase.mockupData.color}`}></div>
                            
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 mt-2">Current Ticket</span>
                            <div className="text-7xl font-black text-gray-900 mb-4 tracking-tighter">12</div>
                            
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${activeCase.mockupData.bg} ${activeCase.mockupData.accent}`}>
                                <activeCase.icon size={16} />
                                {activeCase.mockupData.status}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                               <Clock size={20} className="text-gray-300 mb-2" />
                               <span className="text-gray-400 text-[10px] font-bold uppercase">Wait Time</span>
                               <span className="text-lg font-bold text-gray-900">{activeCase.mockupData.wait}</span>
                           </div>
                           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                               <Star size={20} className="text-gray-300 mb-2" />
                               <span className="text-gray-400 text-[10px] font-bold uppercase">Rating</span>
                               <span className="text-lg font-bold text-gray-900">4.9</span>
                           </div>
                        </div>
                    </div>

                    {/* Footer Mock */}
                    <div className="p-6 pt-0 z-10">
                        <div className={`w-full py-4 ${activeCase.mockupData.color} text-white rounded-2xl font-bold text-sm flex items-center justify-center shadow-lg shadow-gray-200`}>
                           Leave Queue
                        </div>
                    </div>
                </div>
             </PhoneMockup>
          </div>

        </div>
      </div>
    </section>
  );
};

export default UseCases;