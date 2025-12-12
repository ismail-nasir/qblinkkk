
import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

const TiltCard: React.FC<{ feature: any, index: number }> = ({ feature, index }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            style={{
                perspective: 1000,
            }}
            className="h-full"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="bg-white rounded-[20px] md:rounded-[32px] p-4 md:p-8 shadow-sm border border-gray-100 h-full flex flex-col items-start relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/10 transition-shadow duration-300"
            >
                {/* 3D Depth Layer */}
                <div 
                    style={{ transform: "translateZ(50px)" }} 
                    className={`w-10 h-10 md:w-14 md:h-14 ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white mb-3 md:mb-6 shadow-lg shadow-gray-200`}
                >
                    <feature.icon size={20} className="md:w-7 md:h-7" />
                </div>
                
                <div style={{ transform: "translateZ(30px)" }}>
                    <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{feature.title}</h3>
                    <p className="text-xs md:text-base text-gray-500 leading-relaxed">
                        {feature.desc}
                    </p>
                </div>

                {/* Glossy Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ transform: "translateZ(1px)" }} />
            </motion.div>
        </motion.div>
    );
};

const Features: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <TiltCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
