import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import TransactionCapture from './components/TransactionCapture';
import SalesLog from './components/SalesLog';
import Inventory from './components/Inventory';
import ChatAssistant from './components/ChatAssistant';
import { DataProvider } from './context/DataContext';

function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const shopData = localStorage.getItem('shopData');
    if (shopData) {
      setIsOnboarded(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
  };

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <DataProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionCapture />} />
              <Route path="/sales" element={<SalesLog />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/chat" element={<ChatAssistant />} />
            </Routes>
          </div>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;