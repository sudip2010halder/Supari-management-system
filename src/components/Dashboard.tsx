import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Scale, 
  Users, 
  ChevronRight, 
  Plus, 
  Minus,
  Calendar,
  History,
  CheckCircle2,
  Banknote,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useData } from '../context/DataContext';
import { Card, Heading, Metric, Subtext } from './ui/Shared';
import { formatCurrency, formatWeight, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  startOfDay, 
  subDays, 
  format, 
  isSameDay, 
  startOfMonth, 
  eachMonthOfInterval, 
  endOfMonth,
  startOfYear,
  subYears
} from 'date-fns';

import { hapticFeedback } from '../lib/haptics';
import { PasscodeModal } from './ui/PasscodeModal';

export const Dashboard: React.FC = () => {
  const { ledger, clients, settings, setBaseRate, updateLedgerEntry, deleteLedgerEntry } = useData();
  const [trendView, setTrendView] = useState<'day' | 'month' | 'year'>('day');
  const [paymentModal, setPaymentModal] = useState<{ id: string, clientName: string, balance: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [passcodeConfirm, setPasscodeConfirm] = useState<{ id: string } | null>(null);

  // KPI Calculations
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const lifetimeIncome = ledger.reduce((sum, entry) => sum + entry.totalValuation, 0);
    const todayEarnings = ledger
      .filter(entry => isSameDay(new Date(entry.date), today))
      .reduce((sum, entry) => sum + entry.totalValuation, 0);
    const outstandingBalances = ledger.reduce((sum, entry) => sum + entry.outstandingBalance, 0);
    
    const totalWeight = ledger.reduce((sum, entry) => sum + entry.weight, 0);
    const currentMonthWeight = ledger
      .filter(entry => new Date(entry.date) >= startOfMonth(new Date()))
      .reduce((sum, entry) => sum + entry.weight, 0);

    const activeClients = new Set(ledger.map(l => l.clientId)).size;
    const pendingPaymentClients = clients.filter(c => {
      const clientBalance = ledger
        .filter(l => l.clientId === c.id)
        .reduce((sum, l) => sum + l.outstandingBalance, 0);
      return clientBalance > 0;
    }).length;

    return {
      lifetimeIncome,
      todayEarnings,
      outstandingBalances,
      totalWeight,
      currentMonthWeight,
      totalClients: clients.length,
      activeClients,
      pendingPaymentClients
    };
  }, [ledger, clients]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (trendView === 'day') {
      return Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayLabel = format(date, 'EEE');
        const weight = ledger
          .filter(l => isSameDay(new Date(l.date), date))
          .reduce((sum, l) => sum + l.weight, 0);
        return { name: dayLabel, weight };
      });
    }

    if (trendView === 'month') {
      return Array.from({ length: 12 }).map((_, i) => {
        const date = new Date(new Date().getFullYear(), i, 1);
        const label = format(date, 'MMM');
        const monthEntries = ledger.filter(l => {
          const lDate = new Date(l.date);
          return lDate.getMonth() === i && lDate.getFullYear() === new Date().getFullYear();
        });
        const income = monthEntries.reduce((sum, l) => sum + l.totalValuation, 0);
        const debt = monthEntries.reduce((sum, l) => sum + l.outstandingBalance, 0);
        return { name: label, income, debt };
      });
    }

    if (trendView === 'year') {
      return [2024, 2025, 2026].map(year => {
        const yearEntries = ledger.filter(l => new Date(l.date).getFullYear() === year);
        const weight = yearEntries.reduce((sum, l) => sum + l.weight, 0);
        return { name: year.toString(), weight };
      });
    }

    return [];
  }, [ledger, trendView]);

  const handleRateChange = (delta: number) => {
    hapticFeedback.medium();
    setBaseRate(settings.baseRate + delta);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-primary">
            Supari <span className="text-accent">System</span>
          </h1>
          <Subtext>{format(new Date(), 'MMMM do, yyyy')} • Factory Control</Subtext>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Metric 
          label="Today's Earnings" 
          value={formatCurrency(stats.todayEarnings, settings.currencySymbol)} 
          icon={Wallet} 
          subValue="LIVE"
          highlight
        />
        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-1">
          <Metric 
            label="Pending" 
            value={formatCurrency(stats.outstandingBalances, settings.currencySymbol)} 
            icon={History} 
            colorClass="bg-error-light text-error-base"
          />
          <Metric 
            label="Volume" 
            value={formatWeight(stats.totalWeight).replace(' KG', '')} 
            subValue="KG"
            icon={Scale} 
          />
        </div>
      </div>

      {/* Global Rate Panel */}
      <Card className="bg-white border-[#1B4332]/10 overflow-hidden relative p-8">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Base Operation Rate</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-3xl md:text-5xl font-black text-primary tracking-tighter break-all">{settings.currencySymbol}{settings.baseRate.toFixed(2)}</span>
              <span className="text-accent font-bold text-xs md:text-sm tracking-widest uppercase">/ KG</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleRateChange(0.5)}
              className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-primary/20"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => handleRateChange(-0.5)}
              className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-accent/20"
            >
              <Minus size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-primary">
           <Scale size={160} />
        </div>
      </Card>

      {/* Chart Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 flex justify-between items-center border-b border-stone-50 dark:border-stone-800">
          <Heading className="text-lg">Tonnage History</Heading>
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            {(['day', 'month', 'year'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setTrendView(view)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                  trendView === view 
                    ? "bg-white dark:bg-stone-700 text-[#2D5A27] dark:text-[#4ADE80] shadow-sm" 
                    : "text-stone-400"
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            {trendView === 'month' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB33" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }} 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" radius={[6, 6, 0, 0]} fill="#1B4332" />
                <Bar dataKey="debt" radius={[6, 6, 0, 0]} fill="#EF4444" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB66" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7D6B5D', fontWeight: 'bold' }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#1B4332" 
                  strokeWidth={6} 
                  dot={{ r: 5, stroke: '#1B4332', strokeWidth: 3, fill: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity List (Mini) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <Heading className="text-lg">Recent Entries</Heading>
          <button className="text-[#2D5A27] text-xs font-bold flex items-center gap-1">
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {ledger.slice(0, 3).map((entry) => {
            const client = clients.find(c => c.id === entry.clientId);
            return (
              <div key={entry.id}>
                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                      <History size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{client?.fullName || 'Unknown Client'}</h4>
                      <p className="text-[10px] text-stone-400">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-sm">{formatCurrency(entry.totalValuation, settings.currencySymbol)}</p>
                      <p className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1",
                        entry.paymentStatus === 'Fully Paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {entry.paymentStatus}
                      </p>
                    </div>
                    
                    {entry.paymentStatus !== 'Fully Paid' && (
                      <button 
                        onClick={() => {
                          hapticFeedback.light();
                          setPaymentModal({ 
                            id: entry.id, 
                            clientName: client?.fullName || 'Client', 
                            balance: entry.outstandingBalance 
                          });
                          setPaymentAmount(entry.outstandingBalance.toString());
                        }}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="Record Payment"
                      >
                        <Banknote size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        hapticFeedback.medium();
                        if (settings.passcode) {
                          setPasscodeConfirm({ id: entry.id });
                        } else if (confirm('Delete this transaction record?')) {
                          deleteLedgerEntry(entry.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </div>
            );
          })}
          {ledger.length === 0 && (
            <div className="text-center py-10">
              <div className="bg-stone-50 dark:bg-stone-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scale size={32} className="text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm font-medium">No activity logged yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {passcodeConfirm && (
          <PasscodeModal 
            isOpen={true}
            correctPasscode={settings.passcode}
            title="Authorization Required"
            subtext="Enter passcode to delete transaction record"
            onSuccess={() => {
              deleteLedgerEntry(passcodeConfirm.id);
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
                  Payment for {paymentModal.clientName}
                </Subtext>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1 ml-2">
                       <label className="text-[10px] font-black text-stone-400 uppercase">Amount ({settings.currencySymbol})</label>
                       <span className="text-[10px] font-black text-error-base uppercase">Due: {formatCurrency(paymentModal.balance, settings.currencySymbol)}</span>
                    </div>
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
    </motion.div>
  );
};
