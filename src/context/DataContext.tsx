import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, ClientProfile, LedgerEntry } from '../lib/types';

interface DataContextType extends AppState {
  addClient: (client: Omit<ClientProfile, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<ClientProfile>) => void;
  deleteClient: (id: string) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'totalValuation' | 'outstandingBalance' | 'paymentStatus'>) => void;
  updateLedgerEntry: (id: string, entry: Partial<LedgerEntry>) => void;
  deleteLedgerEntry: (id: string) => void;
  setBaseRate: (rate: number) => void;
  setCurrency: (symbol: string) => void;
  setTheme: (theme: AppState['settings']['theme']) => void;
  setPasscode: (passcode: string | undefined) => void;
  addAdmin: (name: string) => void;
  deleteAdmin: (name: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  seedDemoData: () => void;
  resetAll: () => void;
}

const STORAGE_KEY = 'supari_management_data';

const initialState: AppState = {
  clients: [],
  ledger: [],
  settings: {
    baseRate: 45.0,
    currencySymbol: '₹',
    theme: 'light',
  },
  admins: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : initialState;
    if (!parsed.admins) {
      parsed.admins = [];
    }
    return parsed;
  });

  const [isLocked, setIsLocked] = useState(!!state.settings.passcode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addClient = (clientData: Omit<ClientProfile, 'id' | 'createdAt'>) => {
    const newClient: ClientProfile = {
      ...clientData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      clients: [...prev.clients, newClient],
    }));
  };

  const updateClient = (id: string, clientData: Partial<ClientProfile>) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => (c.id === id ? { ...c, ...clientData } : c)),
    }));
  };

  const deleteClient = (id: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      ledger: prev.ledger.filter(l => l.clientId !== id),
    }));
  };

  const addLedgerEntry = (entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'totalValuation' | 'outstandingBalance' | 'paymentStatus'>) => {
    const totalValuation = entryData.weight * entryData.rate;
    const outstandingBalance = totalValuation - entryData.amountPaid;
    let paymentStatus: LedgerEntry['paymentStatus'] = 'Pending Dues';
    if (outstandingBalance <= 0) paymentStatus = 'Fully Paid';
    else if (entryData.amountPaid > 0) paymentStatus = 'Partially Paid';

    const newEntry: LedgerEntry = {
      ...entryData,
      id: uuidv4(),
      totalValuation,
      outstandingBalance,
      paymentStatus,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      ledger: [newEntry, ...prev.ledger],
    }));
  };

  const updateLedgerEntry = (id: string, entryData: Partial<LedgerEntry>) => {
    setState(prev => ({
      ...prev,
      ledger: prev.ledger.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...entryData };
        const totalValuation = updated.weight * updated.rate;
        const outstandingBalance = totalValuation - updated.amountPaid;
        let paymentStatus: LedgerEntry['paymentStatus'] = 'Pending Dues';
        if (outstandingBalance <= 0) paymentStatus = 'Fully Paid';
        else if (updated.amountPaid > 0) paymentStatus = 'Partially Paid';

        return {
          ...updated,
          totalValuation,
          outstandingBalance,
          paymentStatus,
        };
      }),
    }));
  };

  const deleteLedgerEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      ledger: prev.ledger.filter(l => l.id !== id),
    }));
  };

  const setBaseRate = (rate: number) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, baseRate: Math.max(0, rate) },
    }));
  };

  const setCurrency = (symbol: string) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, currencySymbol: symbol },
    }));
  };

  const setTheme = (theme: AppState['settings']['theme']) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, theme },
    }));
  };

  const setPasscode = (passcode: string | undefined) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, passcode },
    }));
  };

  const addAdmin = (name: string) => {
    setState(prev => ({
      ...prev,
      admins: [...(prev.admins || []), name],
    }));
  };

  const deleteAdmin = (name: string) => {
    setState(prev => ({
      ...prev,
      admins: (prev.admins || []).filter(admin => admin !== name),
    }));
  };

  const seedDemoData = () => {
    const demoClients: ClientProfile[] = [
      { id: 'c1', fullName: 'Rajesh Kumar', phoneNumber: '9876543210', address: 'Green Valley Farm', notes: 'Preferred client', fallbackRate: 45, createdAt: new Date().toISOString() },
      { id: 'c2', fullName: 'Anita Devi', phoneNumber: '9123456789', address: 'North Field Sector 4', notes: '', fallbackRate: 45.5, createdAt: new Date().toISOString() },
      { id: 'c3', fullName: 'Suresh Patil', phoneNumber: '9988776655', address: 'River Side Estate', notes: 'Bulk supplier', fallbackRate: 44, createdAt: new Date().toISOString() },
    ];

    const today = new Date();
    const demoLedger: LedgerEntry[] = [];
    
    // Generate some entries for the last 30 days
    demoClients.forEach(client => {
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (Math.random() * 30));
        const weight = 50 + Math.random() * 150;
        const rate = client.fallbackRate;
        const total = weight * rate;
        const paid = Math.random() > 0.3 ? total : total * 0.5;
        const balance = total - paid;
        
        demoLedger.push({
          id: uuidv4(),
          clientId: client.id,
          date: date.toISOString().split('T')[0],
          weight,
          rate,
          totalValuation: total,
          amountPaid: paid,
          outstandingBalance: balance,
          paymentStatus: balance <= 0 ? 'Fully Paid' : (paid > 0 ? 'Partially Paid' : 'Pending Dues'),
          notes: 'Batch #' + (i + 1),
          createdAt: date.toISOString(),
        });
      }
    });

    setState({
      clients: demoClients,
      ledger: demoLedger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      settings: {
        baseRate: 45.0,
        currencySymbol: '₹',
        theme: 'light',
      },
    });
  };

  const resetAll = () => {
    setState(initialState);
  };

  return (
    <DataContext.Provider value={{ ...state, addClient, updateClient, deleteClient, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry, setBaseRate, setCurrency, setTheme, setPasscode, addAdmin, deleteAdmin, isLocked, setIsLocked, seedDemoData, resetAll }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
