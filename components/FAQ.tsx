import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Is Qblink really free?",
    answer: "Yes, Qblink is 100% free forever for all standard features. We support the platform through non-intrusive ads displayed on the customer waiting screen."
  },
  {
    question: "Do my customers need to download an app?",
    answer: "No. Customers simply scan a QR code to join the queue via their mobile browser. No app download or account creation is required."
  },
  {
    question: "How do customers know when it's their turn?",
    answer: "The browser interface updates in real-time. When it's their turn, the screen changes color and vibrates. You can also enable optional SMS notifications."
  },
  {
    question: "Can I manage multiple queues?",
    answer: "Absolutely. You can create different queues for different services (e.g., 'Takeout' vs 'Dine-in') and manage them all from one dashboard."
  },
  {
    question: "Is my data secure?",
    answer: "We use enterprise-grade encryption for all data. We do not sell customer data to third parties."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-3xl md:text-5xl font-bold text-gray-900"
          >
            Frequently Asked
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-base md:text-lg font-bold text-gray-900">{faq.question}</span>
                <ChevronDown 
                  className={`text-gray-400 transition-transform duration-300 shrink-0 ${openIndex === index ? 'rotate-180 text-primary-600' : ''}`} 
                  size={20} 
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 md:px-8 md:pb-8 text-gray-600 leading-relaxed text-sm md:text-base">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;