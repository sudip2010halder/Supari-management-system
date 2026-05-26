import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  ChevronDown, 
  Scale, 
  ArrowRight,
  Sparkles,
  Search,
  Users
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, Heading, Subtext } from './ui/Shared';
import { formatCurrency, formatWeight, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { hapticFeedback } from '../lib/haptics';

export const ProductionEntry: React.FC = () => {
  const { clients, settings, addLedgerEntry } = useData();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState(settings.baseRate.toString());
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId), [clients, selectedClientId]
  );

  useEffect(() => {
    if (selectedClient) {
      setRate(selectedClient.fallbackRate.toString() || settings.baseRate.toString());
    }
  }, [selectedClient, settings.baseRate]);

  // Derived Values
  const numericWeight = parseFloat(weight) || 0;
  const numericRate = parseFloat(rate) || 0;
  const numericPaid = parseFloat(paid) || 0;
  
  const totalValuation = numericWeight * numericRate;
  const balance = totalValuation - numericPaid;
  
  const status = useMemo(() => {
    if (totalValuation === 0) return 'Pending Dues';
    if (balance <= 0) return 'Fully Paid';
    if (numericPaid > 0) return 'Partially Paid';
    return 'Pending Dues';
  }, [totalValuation, balance, numericPaid]);

  const handleAddWeight = (amt: number) => {
    hapticFeedback.light();
    const current = parseFloat(weight) || 0;
    setWeight((current + amt).toString());
  };

  const filteredClients = useMemo(() => 
    clients.filter(c => c.fullName.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || numericWeight <= 0) return;

    addLedgerEntry({
      clientId: selectedClientId,
      date: new Date().toISOString().split('T')[0],
      weight: numericWeight,
      rate: numericRate,
      amountPaid: numericPaid,
      notes: notes
    });

    hapticFeedback.success();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      // Reset form
      setSelectedClientId('');
      setWeight('');
      setPaid('');
      setNotes('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <header>
        <Heading>New Batch</Heading>
        <Subtext>Entry for {format(new Date(), 'MMM dd')}</Subtext>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection (Custom Dropdown) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-stone-400 uppercase ml-2 tracking-widest">Select Client</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClientsOpen(!isClientsOpen)}
              className={cn(
                "w-full bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 h-16 px-4 rounded-2xl flex items-center justify-between text-left transition-all",
                isClientsOpen && "ring-2 ring-[#2D5A27]/20 border-[#2D5A27]/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E9F3E8] dark:bg-stone-800 flex items-center justify-center text-[#2D5A27] dark:text-[#4ADE80]">
                  <Users size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedClient ? selectedClient.fullName : 'Choose a profile'}</p>
                  {selectedClient && <p className="text-[10px] text-stone-400">{selectedClient.phoneNumber}</p>}
                </div>
              </div>
              <ChevronDown size={18} className={cn("text-stone-400 transition-transform", isClientsOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isClientsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 z-[70] max-h-64 overflow-y-auto"
                >
                  <div className="p-2 sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-50 dark:border-stone-800">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full bg-stone-50 dark:bg-stone-800 h-10 pl-9 pr-3 rounded-xl text-xs outline-none"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setIsClientsOpen(false);
                      }}
                      className="w-full p-4 flex items-center gap-3 hover:bg-[#F9FAF9] dark:hover:bg-stone-800 text-left border-b border-stone-50 dark:border-stone-800 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-xs">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{client.fullName}</p>
                        <p className="text-[10px] text-stone-400">{client.phoneNumber}</p>
                      </div>
                    </button>
                  ))}
                  {filteredClients.length === 0 && <p className="p-6 text-center text-xs text-stone-400 italic">No clients found</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Combined Input Section */}
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase ml-2 tracking-widest text-center block">Weight</label>
              <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-4 rounded-3xl text-center">
                 <input 
                   type="number" 
                   step="0.01"
                   placeholder="0.00"
                   className="w-full bg-transparent text-2xl font-black text-center focus:outline-none"
                   value={weight}
                   onChange={(e) => setWeight(e.target.value)}
                 />
                 <p className="text-[10px] font-bold text-stone-300">KILOGRAMS</p>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase ml-2 tracking-widest text-center block">Rate</label>
              <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-4 rounded-3xl text-center opacity-70">
                 <input 
                   type="number" 
                   step="0.1"
                   className="w-full bg-transparent text-2xl font-black text-center focus:outline-none"
                   value={rate}
                   onChange={(e) => setRate(e.target.value)}
                 />
                 <p className="text-[10px] font-bold text-stone-300">PRICE / KG</p>
              </div>
           </div>
        </div>

        {/* Quick Weight Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[5, 10, 25, 50, 100].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => handleAddWeight(amt)}
              className="px-5 py-3 bg-white dark:bg-stone-900 border-2 border-primary/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shadow-sm"
            >
              +{amt}
            </button>
          ))}
          <button 
            type="button" 
            onClick={() => setWeight('0')} 
            className="px-5 py-3 bg-error-light rounded-2xl text-xs font-black uppercase tracking-widest text-error-base"
          >
            Reset
          </button>
        </div>

        {/* Financial Matrix Card */}
        <Card className="bg-primary/5 dark:bg-stone-900/50 border-none p-8">
           <div className="space-y-6">
              <div className="flex justify-between items-center text-accent gap-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Total Billed</span>
                 <span className="text-2xl md:text-3xl font-black text-primary dark:text-stone-100 tracking-tighter transition-all break-all text-right">
                   {formatCurrency(totalValuation, settings.currencySymbol)}
                 </span>
              </div>
              
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-accent uppercase tracking-widest">Amount Paid Today</label>
                   <span className={cn(
                     "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
                     status === 'Fully Paid' ? "bg-primary text-white" : "bg-accent/20 text-accent"
                   )}>{status}</span>
                 </div>
                 <div className="relative">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-primary opacity-30 text-xl">{settings.currencySymbol}</span>
                   <input 
                     type="number" 
                     placeholder="0.00"
                     className="w-full bg-white dark:bg-stone-900 border-2 border-primary/5 h-16 pl-12 pr-4 rounded-3xl text-xl font-black focus:border-primary/20 outline-none tracking-tighter"
                     value={paid}
                     onChange={(e) => setPaid(e.target.value)}
                   />
                 </div>
              </div>

               {balance > 0 && (
                <div className="flex justify-between items-center pt-2 text-error-base gap-2">
                   <span className="text-[10px] font-black tracking-widest uppercase whitespace-nowrap">Balance Due</span>
                   <span className="text-xl md:text-2xl font-black tracking-tighter break-all text-right">{formatCurrency(balance, settings.currencySymbol)}</span>
                </div>
              )}
           </div>
        </Card>

        {/* Submit */}
        <div className="pt-4">
           <button 
             type="submit"
             disabled={!selectedClientId || numericWeight <= 0 || isSuccess}
             className={cn(
               "w-full h-20 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 shadow-2xl transition-all relative overflow-hidden uppercase tracking-widest",
               isSuccess 
                 ? "bg-primary text-white shadow-primary/20" 
                 : "bg-primary text-white shadow-primary/30 enabled:hover:scale-[1.02] active:scale-95 disabled:opacity-30"
             )}
           >
             <AnimatePresence mode="wait">
               {isSuccess ? (
                 <motion.div 
                   key="success"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="flex items-center gap-2"
                 >
                   <Sparkles size={24} /> BATCH LOGGED!
                 </motion.div>
               ) : (
                 <motion.div 
                   key="idle"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="flex items-center gap-2"
                 >
                   LOG WEIGHT & SAVE <ArrowRight size={24} />
                 </motion.div>
               )}
             </AnimatePresence>
           </button>
        </div>
      </form>
    </div>
  );
};
