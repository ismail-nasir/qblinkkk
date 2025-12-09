
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Clock, Shield, Check, X, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, Mail, KeyRound, ChevronLeft, Settings, Server, Wifi } from 'lucide-react';
import { authService } from '../services/auth';
import { User, AppView } from '../types';
import { api } from '../services/api';

interface AuthProps {
  initialMode?: 'login' | 'signup';
  onLogin: (user: User) => void;
  onBack: () => void;
  onNavigate: (view: AppView) => void;
}

type AuthView = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

const Auth: React.FC<AuthProps> = ({ initialMode = 'signup', onLogin, onBack, onNavigate }) => {
  const [view, setView] = useState<AuthView>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Server Config State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(api.currentUrl);
  
  // Data State
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '', // for reset
    code: '', // for verify/reset
    agreedTerms: false,
    agreedPrivacy: false
  });

  // Track the email currently being processed (for verification/reset steps)
  const [activeEmail, setActiveEmail] = useState('');

  // Clear messages on view switch
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    setFormData(prev => ({ ...prev, code: '', password: '', confirmPassword: '' })); // Clear sensitive fields
  }, [view]);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        if (!formData.agreedTerms) throw new Error("You must agree to the Terms & Conditions.");
        if (!formData.agreedPrivacy) throw new Error("You must acknowledge the Privacy Policy.");
        if (passwordStrength < 3) throw new Error("Please choose a stronger password.");
        
        await authService.signup(formData.email, formData.password, formData.businessName);
        setActiveEmail(formData.email);
        setView('verify');
    } catch (err: any) {
        setError(err.message || "Signup failed.");
        // Auto-show config if network error
        if (err.message && (err.message.includes('connect') || err.message.includes('fetch'))) {
            setTimeout(() => setShowServerConfig(true), 1000);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        const user = await authService.login(formData.email, formData.password);
        if (!user.isVerified) {
            setActiveEmail(user.email);
            setView('verify');
            return;
        }
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "Login failed.");
        // Auto-show config if network error
        if (err.message && (err.message.includes('connect') || err.message.includes('fetch'))) {
            setTimeout(() => setShowServerConfig(true), 1000);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        const user = await authService.verifyEmail(activeEmail, formData.code);
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "Verification failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        await authService.requestPasswordReset(formData.email);
        setActiveEmail(formData.email);
        setView('reset');
        setSuccessMsg(`We sent a code to ${formData.email}`);
    } catch (err: any) {
        setError(err.message || "Request failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        if (passwordStrength < 3) throw new Error("Please choose a stronger password.");
        await authService.resetPassword(activeEmail, formData.code, formData.password);
        setSuccessMsg("Password reset successfully. Please login.");
        setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
        setError(err.message || "Reset failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
      setIsLoading(true);
      try {
          await authService.resendVerification(activeEmail);
          setSuccessMsg("Verification code resent.");
      } catch (err) {
          setError("Failed to resend code.");
      } finally {
          setIsLoading(false);
      }
  };

  const saveServerUrl = () => {
      api.setBaseUrl(serverUrl);
      setShowServerConfig(false);
      window.location.reload(); // Reload to re-init socket
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderFormContent = () => {
      switch(view) {
          case 'login':
              return (
                  <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Email</label>
                          <input 
                              type="email" 
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              required
                          />
                      </div>
                      <div className="space-y-1">
                          <div className="flex justify-between items-center">
                              <label className="text-sm font-semibold text-gray-700">Password</label>
                              <button type="button" onClick={() => setView('forgot')} className="text-sm text-primary-600 font-semibold hover:underline">Forgot Password?</button>
                          </div>
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
                      </div>
                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 md:h-14 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                      </button>
                  </form>
              );

          case 'signup':
              return (
                  <form onSubmit={handleSignup} className="space-y-5">
                      <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Business Name</label>
                          <input 
                              type="text" 
                              placeholder="Your Business"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                              value={formData.businessName}
                              onChange={e => setFormData({...formData, businessName: e.target.value})}
                              required
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Email</label>
                          <input 
                              type="email" 
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              required
                          />
                      </div>
                      <div className="space-y-1">
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
                      </div>
                       {formData.password.length > 0 && (
                          <div className="space-y-3 pt-1">
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
                          </div>
                      )}
                      
                      <div className="space-y-3 pt-2">
                          <div className="flex items-start gap-3">
                              <div 
                                  className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${formData.agreedTerms ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'}`}
                                  onClick={() => setFormData({...formData, agreedTerms: !formData.agreedTerms})}
                              >
                                  {formData.agreedTerms && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 select-none leading-tight">
                                  I agree to the <button onClick={(e) => {e.preventDefault(); onNavigate(AppView.TERMS)}} className="text-primary-600 font-semibold hover:underline">Terms & Conditions</button>
                              </span>
                          </div>
                          <div className="flex items-start gap-3">
                              <div 
                                  className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${formData.agreedPrivacy ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'}`}
                                  onClick={() => setFormData({...formData, agreedPrivacy: !formData.agreedPrivacy})}
                              >
                                  {formData.agreedPrivacy && <Check size={14} className="text-white" />}
                              </div>
                              <span className="text-sm text-gray-600 select-none leading-tight">
                                  I have read and acknowledge the <button onClick={(e) => {e.preventDefault(); onNavigate(AppView.PRIVACY)}} className="text-primary-600 font-semibold hover:underline">Privacy Policy</button>
                              </span>
                          </div>
                      </div>

                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 md:h-14 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                      </button>
                  </form>
              );

          case 'verify':
              return (
                  <form onSubmit={handleVerify} className="space-y-6">
                      <div className="text-center">
                          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                              <Mail size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Check your inbox</h3>
                          <p className="text-gray-500 text-sm mt-1">
                              We sent a verification code to <br/> <span className="font-semibold text-gray-900">{activeEmail}</span>
                          </p>
                          <div className="mt-2 text-xs text-blue-500 bg-blue-50 py-1 px-2 rounded inline-block border border-blue-100">
                            Simulated Code: <b>123456</b>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Verification Code</label>
                          <input 
                              type="text" 
                              placeholder="123456"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-center text-2xl tracking-widest font-mono"
                              value={formData.code}
                              onChange={e => setFormData({...formData, code: e.target.value})}
                              maxLength={6}
                              required
                          />
                      </div>

                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 md:h-14 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Verify Email'}
                      </button>

                      <div className="text-center">
                           <button type="button" onClick={handleResendCode} className="text-sm text-gray-500 font-semibold hover:text-primary-600">
                               Didn't receive code? Resend
                           </button>
                      </div>
                  </form>
              );

          case 'forgot':
              return (
                   <form onSubmit={handleForgot} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Email Address</label>
                          <input 
                              type="email" 
                              placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              required
                          />
                      </div>

                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 md:h-14 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
                      </button>

                      <div className="text-center">
                           <button type="button" onClick={() => setView('login')} className="flex items-center justify-center gap-2 text-sm text-gray-500 font-semibold hover:text-gray-800 mx-auto">
                               <ChevronLeft size={16} /> Back to Login
                           </button>
                      </div>
                  </form>
              );

          case 'reset':
              return (
                   <form onSubmit={handleResetPassword} className="space-y-5">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 text-center mb-2">
                          Simulated Reset Code: <b>123456</b>
                      </div>
                      <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">Reset Code</label>
                          <input 
                              type="text" 
                              placeholder="123456"
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-mono tracking-wider"
                              value={formData.code}
                              onChange={e => setFormData({...formData, code: e.target.value})}
                              required
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-sm font-semibold text-gray-700">New Password</label>
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
                      </div>
                      
                      {/* Reuse strength meter if needed or keep simple */}
                      
                      <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-12 md:h-14 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                      </button>
                  </form>
              );
      }
  };

  const titles: Record<AuthView, { title: string, subtitle: string }> = {
    login: { title: "Welcome Back", subtitle: "Enter your details to access your dashboard" },
    signup: { title: "Create Account", subtitle: "Start managing queues in 30 seconds" },
    verify: { title: "Verify Email", subtitle: "Enter the code sent to your inbox" },
    forgot: { title: "Forgot Password", subtitle: "We'll send you instructions to reset it" },
    reset: { title: "Reset Password", subtitle: "Choose a new secure password" }
  };

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
         
         <button 
            onClick={() => setShowServerConfig(true)} 
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
            title="Server Configuration"
         >
            <Settings size={20} />
         </button>

        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                {view === 'signup' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4">
                      <Zap size={12} fill="currentColor" /> Get started free
                  </motion.div>
                )}
                <motion.h1 
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
                >
                    {titles[view].title}
                </motion.h1>
                <motion.p 
                    key={`${view}-sub`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500"
                >
                    {titles[view].subtitle}
                </motion.p>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-red-50 border border-red-100 flex flex-col items-start gap-3 overflow-hidden"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                            </div>
                        </div>
                        
                        {/* Smart Fix Button for Network Errors */}
                        {(error.includes('connect') || error.includes('fetch') || error.includes('Network')) && (
                            <button 
                                onClick={() => setShowServerConfig(true)}
                                className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors mt-1"
                            >
                                <Wifi size={14} /> Fix Connection Settings
                            </button>
                        )}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3 overflow-hidden"
                    >
                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-600 font-medium">{successMsg}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderFormContent()}
                </motion.div>
            </AnimatePresence>

            {(view === 'login' || view === 'signup') && (
                <div className="text-center pt-4">
                    <p className="text-gray-600">
                        {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                        <button 
                            onClick={() => setView(view === 'signup' ? 'login' : 'signup')}
                            className="ml-1.5 text-primary-600 font-bold hover:underline"
                        >
                            {view === 'signup' ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            )}
        </div>
      </div>
      
      {/* Server Configuration Modal */}
      <AnimatePresence>
          {showServerConfig && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                  >
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                             <Server size={20} className="text-primary-600" /> Server Connection
                          </h3>
                          <button onClick={() => setShowServerConfig(false)} className="text-gray-400 hover:text-gray-600">
                              <X size={20} />
                          </button>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                          <h4 className="text-sm font-bold text-blue-800 mb-1">Using another device?</h4>
                          <p className="text-xs text-blue-700 leading-relaxed mb-2">
                              Your phone cannot reach <code>localhost</code>. You must use your computer's local IP address.
                          </p>
                          <p className="text-xs text-blue-800 font-mono bg-blue-100/50 p-2 rounded border border-blue-200">
                              e.g. http://192.168.1.5:3000
                          </p>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Backend URL</label>
                              <input 
                                type="text" 
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="http://192.168.1.x:3000"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-sm"
                              />
                          </div>
                          
                          <button 
                            onClick={saveServerUrl}
                            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                          >
                              Save & Reload
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
