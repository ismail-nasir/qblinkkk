import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Clock, Shield, Check, X, Eye, EyeOff, Upload, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthProps {
  initialMode?: 'login' | 'signup';
  onLogin: (businessName: string) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialMode = 'signup', onLogin, onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    agreed: false
  });

  // Password Strength Logic
  const passwordCriteria = [
    { label: "At least 8 characters", valid: formData.password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(formData.password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(formData.password) },
    { label: "One number", valid: /[0-9]/.test(formData.password) },
  ];
  
  const passwordStrength = passwordCriteria.filter(c => c.valid).length;
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      // Determine display name
      const name = mode === 'signup' && formData.businessName ? formData.businessName : "My Business";
      onLogin(name);
    }, 1500);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-white animate-fade-in">
      {/* LEFT SIDE - Features & Testimonial (Hidden on mobile) */}
      <div className="hidden lg:flex w-[45%] bg-blue-50/50 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Decorative Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <div onClick={onBack} className="flex items-center gap-2 cursor-pointer mb-12 hover:opacity-70 transition-opacity w-fit">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-600/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Qblink</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
            Join 500+ businesses delivering exceptional customer experiences with zero friction.
          </h2>

          <div className="space-y-6">
            {[
              { icon: Zap, text: "Setup in under 30 seconds" },
              { icon: Users, text: "Unlimited queues & customers" },
              { icon: Clock, text: "Real-time updates & analytics" },
              { icon: Shield, text: "Forever free • No credit card" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-gray-700 font-medium">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                  <item.icon size={20} />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-white mt-12">
          <p className="text-gray-600 italic text-lg mb-4">
            "Qlink transformed our customer experience. Wait times down 40%, satisfaction up 60%."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Sarah Chen</p>
              <p className="text-xs text-gray-500">Coffee House Owner</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 relative">
         <button onClick={onBack} className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} /> Back
         </button>

        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                {mode === 'signup' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4">
                      <Zap size={12} fill="currentColor" /> Get started free
                  </motion.div>
                )}
                <motion.h1 layout className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
                </motion.h1>
                <motion.p layout className="text-gray-500">
                    {mode === 'signup' ? 'Start managing queues in 30 seconds' : 'Enter your details to access your dashboard'}
                </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="popLayout" initial={false}>
                    {mode === 'signup' && (
                        <motion.div 
                            key="business-field"
                            initial={{ opacity: 0, y: -20, height: 0 }} 
                            animate={{ opacity: 1, y: 0, height: 'auto' }} 
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1 overflow-hidden"
                        >
                            <label className="text-sm font-semibold text-gray-700">Business Name</label>
                            <input 
                                type="text" 
                                placeholder="Your Business"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                value={formData.businessName}
                                onChange={e => setFormData({...formData, businessName: e.target.value})}
                                required={mode === 'signup'}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div layout className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input 
                        type="email" 
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                    />
                </motion.div>

                <motion.div layout className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </motion.div>

                {/* Password Strength Meter - Signup Only */}
                <AnimatePresence>
                    {mode === 'signup' && formData.password.length > 0 && (
                        <motion.div 
                            key="strength-meter"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-1 overflow-hidden"
                        >
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-500">Password strength</span>
                                <span className={
                                    passwordStrength <= 1 ? "text-red-500" : 
                                    passwordStrength <= 2 ? "text-orange-500" :
                                    passwordStrength <= 3 ? "text-yellow-500" : "text-green-500"
                                }>{getStrengthLabel()}</span>
                            </div>
                            <div className="flex gap-2 h-1.5 w-full">
                                {[1, 2, 3, 4].map((step) => (
                                    <div 
                                        key={step} 
                                        className={`flex-1 rounded-full transition-colors duration-300 ${
                                            step <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                                        }`} 
                                    />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {passwordCriteria.map((criterion, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                                        {criterion.valid ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-gray-400" />}
                                        <span className={criterion.valid ? "text-green-600 font-medium" : ""}>{criterion.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Business Logo - Signup Only */}
                <AnimatePresence>
                    {mode === 'signup' && (
                         <motion.div 
                            key="logo-field"
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1 overflow-hidden"
                        >
                            <label className="text-sm font-semibold text-gray-700">Business Logo <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                                    Choose File
                                    <input type="file" className="hidden" />
                                </label>
                                <span className="text-gray-400 text-sm">No file chosen</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Terms - Signup Only */}
                {mode === 'signup' && (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex items-center gap-3 pt-2"
                     >
                        <div 
                            className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${formData.agreed ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'}`}
                            onClick={() => setFormData({...formData, agreed: !formData.agreed})}
                        >
                            {formData.agreed && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-600 select-none">
                            I agree to the <a href="#" className="text-primary-600 font-semibold hover:underline">Terms</a> and <a href="#" className="text-primary-600 font-semibold hover:underline">Privacy Policy</a>
                        </span>
                    </motion.div>
                )}

                <motion.button 
                    layout
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 md:h-14 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                </motion.button>
            </form>

            <div className="text-center pt-4">
                <p className="text-gray-600">
                    {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                        className="ml-1.5 text-primary-600 font-bold hover:underline"
                    >
                         {mode === 'signup' ? 'Sign in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;