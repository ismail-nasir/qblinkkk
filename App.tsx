import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import UseCases from './components/UseCases';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import PainPoints from './components/PainPoints';
import About from './components/About';
import PrivacyPolicy from './components/PrivacyPolicy';
import Terms from './components/Terms';
import Auth from './components/Auth';
import { AppView, User } from './types';
import { authService } from './services/auth';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for session on mount
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Only go to dashboard if we are already there or on landing, 
        // otherwise let the url/view logic handle it (simple version here)
        setView(AppView.DASHBOARD);
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setView(AppView.AUTH);
    window.scrollTo(0, 0);
  };
  
  const handleSignIn = () => {
    setAuthMode('login');
    setView(AppView.AUTH);
    window.scrollTo(0, 0);
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(AppView.DASHBOARD);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setView(AppView.LANDING);
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setView(AppView.LANDING);
    window.scrollTo(0, 0);
  };
  
  const handleNavigate = (newView: AppView) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  if (isInitializing) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
    );
  }

  // Render Full Page Auth
  if (view === AppView.AUTH) {
    return (
      <Auth 
        initialMode={authMode} 
        onLogin={handleAuthSuccess} 
        onBack={handleBackToHome} 
      />
    );
  }

  if (view === AppView.DASHBOARD && user) {
    return (
      <Dashboard 
        user={user} 
        onLogout={handleLogout} 
      />
    );
  }

  // Common Layout Wrappers for Pages
  const renderPage = (content: React.ReactNode) => (
    <div className="min-h-screen font-sans bg-[#F8FAFC] overflow-x-hidden text-gray-900 relative selection:bg-primary-100 selection:text-primary-700">
       <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-200/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-cyan-200/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>
      <Navbar onGetStarted={handleGetStarted} onSignIn={handleSignIn} onNavigate={handleNavigate} currentView={view} />
      <main className="relative z-10 min-h-screen">
        {content}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
  
  if (view === AppView.PRIVACY) {
    return renderPage(<PrivacyPolicy onBack={handleBackToHome} />);
  }

  if (view === AppView.TERMS) {
    return renderPage(<Terms onBack={handleBackToHome} />);
  }

  if (view === AppView.ABOUT) {
    return renderPage(<About onBack={handleBackToHome} />);
  }

  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC] overflow-x-hidden text-gray-900 relative selection:bg-primary-100 selection:text-primary-700">
      {/* Ambient Background Gradient for Glass Effect */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-200/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-cyan-200/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <Navbar onGetStarted={handleGetStarted} onSignIn={handleSignIn} onNavigate={handleNavigate} currentView={view} />
      
      <main className="relative z-10">
        <Hero onGetStarted={handleGetStarted} />
        
        <div id="trusted-by">
          <TrustedBy />
        </div>
        
        <PainPoints />
        
        <div id="how-it-works">
          <HowItWorks />
        </div>
        
        <div id="features">
          <Features />
        </div>
        
        <div id="use-cases">
          <UseCases />
        </div>
        
        <div id="pricing">
          <Pricing onGetStarted={handleGetStarted} />
        </div>
        
        <div id="faq">
          <FAQ />
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;