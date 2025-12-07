import React, { useState } from 'react';
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
import { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);

  const handleGetStarted = () => {
    setView(AppView.DASHBOARD);
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setView(AppView.LANDING);
    window.scrollTo(0, 0);
  };

  if (view === AppView.DASHBOARD) {
    return <Dashboard onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC] overflow-x-hidden text-gray-900">
      <Navbar onGetStarted={handleGetStarted} />
      
      <main>
        <Hero onGetStarted={handleGetStarted} />
        <TrustedBy />
        <HowItWorks />
        <Features />
        <UseCases />
        <Pricing onGetStarted={handleGetStarted} />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
};

export default App;