import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ArrowLeft,
  Trash2,
  Edit,
  UserPlus,
  History,
  Banknote
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, Heading, Subtext } from './ui/Shared';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ClientProfile, LedgerEntry } from '../lib/types';
import { hapticFeedback } from '../lib/haptics';
import { PasscodeModal } from './ui/PasscodeModal';

export const Clients: React.FC = () => {
  const { clients, ledger, addClient, updateClient, deleteClient, updateLedgerEntry, deleteLedgerEntry, settings } = useData();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ id: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [passcodeConfirm, setPasscodeConfirm] = useState<{ type: 'client' | 'history', id: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    notes: '',
    fallbackRate: settings.baseRate
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(search.toLowerCase()) || 
      c.phoneNumber.includes(search)
    );
  }, [clients, search]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId), [clients, selectedClientId]
  );

  const clientStats = useMemo(() => {
    if (!selectedClientId) return null;
    const clientLedger = ledger.filter(l => l.clientId === selectedClientId);
    return {
      totalWeight: clientLedger.reduce((sum, l) => sum + l.weight, 0),
      totalBilled: clientLedger.reduce((sum, l) => sum + l.totalValuation, 0),
      totalPaid: clientLedger.reduce((sum, l) => sum + l.amountPaid, 0),
      balance: clientLedger.reduce((sum, l) => sum + l.outstandingBalance, 0),
      history: clientLedger
    };
  }, [selectedClientId, ledger]);

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;
    
    if (editingClient) {
      updateClient(editingClient.id, formData);
      hapticFeedback.success();
    } else {
      addClient(formData);
      hapticFeedback.success();
    }
    
    setFormData({ fullName: '', phoneNumber: '', address: '', notes: '', fallbackRate: settings.baseRate });
    setIsAdding(false);
    setEditingClient(null);
  };

  const startEditing = (client: ClientProfile) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName,
      phoneNumber: client.phoneNumber,
      address: client.address,
      notes: client.notes,
      fallbackRate: client.fallbackRate
    });
    setIsAdding(true);
  };

  if (selectedClientId && selectedClient) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <button 
          onClick={() => setSelectedClientId(null)}
          className="mb-6 flex items-center gap-2 text-stone-500 font-bold hover:text-stone-800 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Directory
        </button>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Heading className="text-2xl">{selectedClient.fullName}</Heading>
              <div className="flex gap-4 mt-2 text-stone-400">
                <span className="flex items-center gap-1 text-[11px] font-bold"><Phone size={12} /> {selectedClient.phoneNumber}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold"><MapPin size={12} /> {selectedClient.address}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => startEditing(selectedClient)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={() => {
                  if (settings.passcode) {
                    setPasscodeConfirm({ type: 'client', id: selectedClient.id });
                  } else if (confirm('Are you sure you want to delete this client? All history will be lost.')) {
                    deleteClient(selectedClient.id);
                    setSelectedClientId(null);
                  }
                }}
                className="p-2 rounded-xl bg-red-50 dark:bg-stone-800 text-red-500 hover:bg-red-100 transition-colors"
                title="Delete Client Profile"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#2D5A27] text-white p-5 rounded-[24px] overflow-hidden">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Total Paid</p>
                <p className="text-xl font-black break-all">{formatCurrency(clientStats?.totalPaid || 0, settings.currencySymbol)}</p>
             </div>
             <div className="bg-[#EF4444] text-white p-5 rounded-[24px] overflow-hidden">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Current Dues</p>
                <p className="text-xl font-black break-all">{formatCurrency(clientStats?.balance || 0, settings.currencySymbol)}</p>
             </div>
          </div>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Transaction History</h3>
              <span className="text-[10px] font-black bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-full text-stone-500">
                {clientStats?.history.length} ITEMS
              </span>
            </div>
            <div className="space-y-4">
               {clientStats?.history.map(item => (
                 <div key={item.id} className="flex justify-between items-center pb-4 border-b border-stone-50 dark:border-stone-800 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold">{format(new Date(item.date), 'MMM dd, yyyy')}</p>
                      <p className="text-[10px] text-stone-400">{item.weight.toFixed(2)} KG @ {settings.currencySymbol}{item.rate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black">{formatCurrency(item.totalValuation, settings.currencySymbol)}</p>
                        <p className={cn(
                          "text-[9px] font-bold",
                          item.paymentStatus === 'Fully Paid' ? "text-green-600" : "text-red-500"
                        )}>{item.paymentStatus}</p>
                      </div>
                      
                      {item.paymentStatus !== 'Fully Paid' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback.light();
                            setPaymentModal({ id: item.id });
                            setPaymentAmount(item.outstandingBalance.toString());
                          }}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Record Payment"
                        >
                          <Banknote size={18} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          hapticFeedback.medium();
                          if (settings.passcode) {
                            setPasscodeConfirm({ type: 'history', id: item.id });
                          } else if (confirm('Delete this transaction record permanently?')) {
                            deleteLedgerEntry(item.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
               ))}
               {clientStats?.history.length === 0 && <p className="text-center text-stone-400 py-4 italic">No transactions yet.</p>}
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Heading>Directory</Heading>
          <Subtext>{clients.length} registered profiles</Subtext>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white p-4 rounded-3xl flex items-center gap-2 shadow-xl shadow-primary/20 transition-transform active:scale-95"
        >
          <UserPlus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} strokeWidth={3} />
        <input 
          type="text" 
          placeholder="Lookup name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-stone-900 border-2 border-primary/5 h-16 pl-14 pr-4 rounded-4xl text-sm focus:outline-none focus:border-primary/20 transition-all font-black uppercase tracking-tight"
        />
      </div>

      {/* Client List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredClients.map((client) => {
            const clientLedger = ledger.filter(l => l.clientId === client.id);
            const balance = clientLedger.reduce((sum, l) => sum + l.outstandingBalance, 0);
            
            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedClientId(client.id)}
              >
                <Card className="hover:border-primary/20 transition-all cursor-pointer group active:scale-[0.98] border-2 border-transparent">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-3xl bg-primary/5 dark:bg-stone-800 flex items-center justify-center text-primary dark:text-[#4ADE80] font-black text-xl">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-primary dark:text-stone-100 uppercase tracking-tighter">{client.fullName}</h4>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">{client.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm md:text-base font-black tracking-tighter break-all",
                        balance > 0 ? "text-error-base" : "text-primary opacity-40"
                      )}>
                        {balance > 0 ? formatCurrency(balance, settings.currencySymbol) : 'CLEAR'}
                      </p>
                      <ChevronRight size={16} className="text-primary/20 ml-auto mt-1" strokeWidth={3} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredClients.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-[32px] border border-dashed border-stone-200 dark:border-stone-800">
             <p className="text-stone-400 font-bold">No clients found</p>
             <button 
               onClick={() => setIsAdding(true)}
               className="mt-4 text-[#2D5A27] font-bold text-sm bg-[#E9F3E8] px-4 py-2 rounded-full"
             >
               Add New Client
             </button>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
               onClick={() => setIsAdding(false)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white dark:bg-stone-900 rounded-[32px] w-full max-w-sm overflow-hidden relative shadow-2xl"
            >
              <div className="p-6">
                <Heading className="mb-1">{editingClient ? 'Edit Client' : 'New Client'}</Heading>
                <Subtext className="mb-6">{editingClient ? 'Update profile information' : 'Registration profile'}</Subtext>

                <form onSubmit={handleSaveClient} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Name *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Ramesh Patel"
                      className="w-full bg-stone-50 dark:bg-stone-800 border-0 h-12 px-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+91..."
                      className="w-full bg-stone-50 dark:bg-stone-800 border-0 h-12 px-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Address</label>
                    <input 
                      type="text" 
                      placeholder="Street, Village..."
                      className="w-full bg-stone-50 dark:bg-stone-800 border-0 h-12 px-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Rate (₹/KG)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-stone-50 dark:bg-stone-800 border-0 h-12 px-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
                        value={formData.fallbackRate}
                        onChange={(e) => setFormData({...formData, fallbackRate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Notes</label>
                    <textarea 
                      placeholder="Special instructions..."
                      className="w-full bg-stone-50 dark:bg-stone-800 border-0 h-24 p-4 rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27]/20 outline-none resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingClient(null);
                      }}
                      className="flex-1 h-14 rounded-2xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className={cn(
                        "flex-[2] h-14 rounded-2xl font-bold text-white transition-all shadow-lg",
                        editingClient ? "bg-amber-600 shadow-amber-600/20" : "bg-primary shadow-primary/20"
                      )}
                    >
                      {editingClient ? 'Update Profile' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment and Prepaid Modal */}
      <AnimatePresence>
        {passcodeConfirm && (
          <PasscodeModal 
            isOpen={true}
            correctPasscode={settings.passcode}
            title="Authorization Required"
            subtext={passcodeConfirm.type === 'client' ? "Enter passcode to delete client profile" : "Enter passcode to delete transaction record"}
            onSuccess={() => {
              if (passcodeConfirm.type === 'client') {
                deleteClient(passcodeConfirm.id);
                setSelectedClientId(null);
              } else {
                deleteLedgerEntry(passcodeConfirm.id);
              }
              setPasscodeConfirm(null);
            }}
            onCancel={() => setPasscodeConfirm(null)}
          />
        )}
        {paymentModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" 
               onClick={() => setPaymentModal(null)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white dark:bg-stone-900 rounded-[32px] w-full max-w-sm overflow-hidden relative shadow-2xl"
            >
              <div className="p-8">
                <div className="w-16 h-16 rounded-3xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
                   <Banknote size={32} />
                </div>
                
                <Heading className="mb-1">Record Payment</Heading>
                <Subtext className="mb-6 font-bold uppercase tracking-wider">
                   Partial or Full Payment for Entry
                </Subtext>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Amount ({settings.currencySymbol})</label>
                    <input 
                      autoFocus
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 h-16 px-6 rounded-2xl text-2xl font-black focus:border-green-500 outline-none transition-all"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button 
                      onClick={() => setPaymentModal(null)}
                      className="flex-1 h-14 rounded-2xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        const amount = parseFloat(paymentAmount);
                        if (isNaN(amount) || amount <= 0) return;

                        if (paymentModal.id) {
                          const entry = ledger.find(l => l.id === paymentModal.id);
                          if (entry) {
                            if (amount > entry.outstandingBalance) {
                              hapticFeedback.error();
                              return;
                            }
                            updateLedgerEntry(paymentModal.id, { 
                              amountPaid: entry.amountPaid + amount 
                            });
                          }
                        }

                        hapticFeedback.success();
                        setPaymentModal(null);
                        setPaymentAmount('');
                      }}
                      className={cn(
                        "flex-[2] h-14 rounded-2xl font-bold text-white transition-all shadow-lg",
                        (parseFloat(paymentAmount) > (ledger.find(l => l.id === paymentModal.id)?.outstandingBalance || 0))
                          ? "bg-stone-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                      )}
                      disabled={parseFloat(paymentAmount) > (ledger.find(l => l.id === paymentModal.id)?.outstandingBalance || 0)}
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
