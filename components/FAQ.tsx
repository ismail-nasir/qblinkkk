import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import RevealOnScroll from './RevealOnScroll';

const faqs = [
  {
    question: "Do customers need to download an app?",
    answer: "No app required. Q-Blink works entirely in the web browser. Customers simply scan a QR code to join the queue, making it completely frictionless."
  },
  {
    question: "Does it work on older smartphones?",
    answer: "Yes. As long as the phone has a camera to scan a QR code and a web browser, Q-Blink works perfectly. It is optimized to be lightweight and fast even on 3G connections."
  },
  {
    question: "How do I notify customers?",
    answer: "The interface updates in real-time on their phone screen. We also offer SMS notifications on our Pro plan if you want to text them when it's their turn."
  },
  {
    question: "Is there a limit to the queue size?",
    answer: "Our free tier supports up to 50 concurrent active tickets. For larger events or enterprise needs, our unlimited plan handles thousands of simultaneous users."
  }
];

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200/60 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'}`}>
          {question}
        </span>
        <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-indigo-100 rotate-180' : 'bg-gray-100 group-hover:bg-indigo-50'}`}>
          {isOpen ? <Minus size={18} className="text-indigo-600" /> : <Plus size={18} className="text-gray-600 group-hover:text-indigo-600" />}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-40 opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed pr-8">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section className="py-20 md:py-28 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know about setting up your queue.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-glass p-6 md:p-10">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} />
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default FAQ;