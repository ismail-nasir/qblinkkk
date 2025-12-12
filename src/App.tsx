
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import UseCases from './components/UseCases';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PainPoints from './components/PainPoints';
import { AppView, User } from './types';
import { authService } from './services/auth';

// Lazy load pages to split code
const About = lazy(() => import('./components/About'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const Terms = lazy(() => import('./components/Terms'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Auth = lazy(() => import('./components/Auth'));
const CustomerView = lazy(() => import('./components/CustomerView'));
const DisplayView = lazy(() => import('./components/DisplayView'));

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [urlParams, setUrlParams] = useState<{ queueId?: string, view?: string }>({});

  useEffect(() => {
    const init = async () => {
      // 1. Parse URL Params
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const queueIdParam = params.get('queueId');
      
      setUrlParams({ queueId: queueIdParam || undefined, view: viewParam || undefined });

      if (viewParam === 'customer' && queueIdParam) {
          setView(AppView.CUSTOMER);
          setIsInitializing(false);
          return;
      }

      if (viewParam === 'display' && queueIdParam) {
          setView(AppView.DISPLAY);
          setIsInitializing(false);
          return;
      }

      // 2. Check Auth
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setView(AppView.DASHBOARD);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
      setIsInitializing(false);
    };
    init();
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

  // Native SVG Loader
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Handle Standalone Views first
  if (view === AppView.CUSTOMER && urlParams.queueId) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <CustomerView queueId={urlParams.queueId} />
        </Suspense>
      );
  }

  if (view === AppView.DISPLAY && urlParams.queueId) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <DisplayView queueId={urlParams.queueId} />
        </Suspense>
      );
  }

  // Render Full Page Auth
  if (view === AppView.AUTH) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Auth 
          initialMode={authMode} 
          onLogin={handleAuthSuccess} 
          onBack={handleBackToHome}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (view === AppView.DASHBOARD && user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      </Suspense>
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
        <Suspense fallback={<LoadingScreen />}>
          {content}
        </Suspense>
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

  // Default: Landing Page
  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC] overflow-x-hidden text-gray-900 relative selection:bg-primary-100 selection:text-primary-700">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-200/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] bg-cyan-200/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <Navbar onGetStarted={handleGetStarted} onSignIn={handleSignIn} onNavigate={handleNavigate} currentView={view} />
      
      <main className="relative z-10">
        <Hero onGetStarted={handleGetStarted} />
        <div id="trusted-by"><TrustedBy /></div>
        <PainPoints />
        <div id="how-it-works"><HowItWorks /></div>
        <div id="features"><Features /></div>
        <div id="use-cases"><UseCases /></div>
        <div id="pricing"><Pricing onGetStarted={handleGetStarted} /></div>
        <div id="faq"><FAQ /></div>
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
