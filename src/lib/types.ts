export type PaymentStatus = 'Fully Paid' | 'Partially Paid' | 'Pending Dues';

export interface ClientProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  fallbackRate: number;
  createdAt: string;
  // Computed (can be derived but stored for performance if needed, 
  // though for small apps we usually derive from ledger)
}

export interface LedgerEntry {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  rate: number;
  totalValuation: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
}

export interface AppState {
  clients: ClientProfile[];
  ledger: LedgerEntry[];
  settings: {
    baseRate: number;
    currencySymbol: string;
    theme: 'light' | 'dark' | 'system';
    passcode?: string;
  };
  admins?: string[];
}
