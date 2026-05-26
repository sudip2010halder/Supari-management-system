/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Layout, View } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { ProductionEntry } from './components/ProductionEntry';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { About } from './components/About';
import { PasscodeModal } from './components/ui/PasscodeModal';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { settings, isLocked, setIsLocked } = useData();

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <Clients />;
      case 'entry': return <ProductionEntry />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings onOpenAbout={() => setActiveView('about')} />;
      case 'about': return <About onBack={() => setActiveView('settings')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <PasscodeModal 
            isOpen={true} 
            isLockScreen={true}
            correctPasscode={settings.passcode}
            onSuccess={() => setIsLocked(false)}
            title="Supari System Locked"
            subtext="Enter your secure passcode"
          />
        )}
      </AnimatePresence>

      <Layout activeView={activeView} onViewChange={setActiveView}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
