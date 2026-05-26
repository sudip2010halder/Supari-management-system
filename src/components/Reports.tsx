import React, { useState, useMemo } from 'react';
import { 
  FileDown, 
  Share2, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, Heading, Subtext, Metric } from './ui/Shared';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  startOfYear,
  isWithinInterval,
  isSameDay
} from 'date-fns';

type TimeRange = 'today' | 'yesterday' | '7days' | 'month' | 'year' | 'all';

export const Reports: React.FC = () => {
  const { ledger, clients, settings } = useData();
  const [range, setRange] = useState<TimeRange>('month');

  const filteredLedger = useMemo(() => {
    const today = startOfDay(new Date());
    const now = new Date();

    return ledger.filter(entry => {
      const entryDate = new Date(entry.date);
      
      switch (range) {
        case 'today': return isSameDay(entryDate, today);
        case 'yesterday': return isSameDay(entryDate, subDays(today, 1));
        case '7days': return isWithinInterval(entryDate, { start: subDays(today, 7), end: now });
        case 'month': return isWithinInterval(entryDate, { start: startOfMonth(today), end: now });
        case 'year': return isWithinInterval(entryDate, { start: startOfYear(today), end: now });
        case 'all': return true;
        default: return true;
      }
    });
  }, [ledger, range]);

  const reportStats = useMemo(() => {
    const totalWeight = filteredLedger.reduce((sum, l) => sum + l.weight, 0);
    const totalEarnings = filteredLedger.reduce((sum, l) => sum + l.totalValuation, 0);
    const totalDues = filteredLedger.reduce((sum, l) => sum + l.outstandingBalance, 0);

    // Group by client
    const clientMap = new Map();
    filteredLedger.forEach(l => {
      const current = clientMap.get(l.clientId) || { weight: 0, earnings: 0, balance: 0 };
      clientMap.set(l.clientId, {
        weight: current.weight + l.weight,
        earnings: current.earnings + l.totalValuation,
        balance: current.balance + l.outstandingBalance
      });
    });

    const clientRanking = Array.from(clientMap.entries())
      .map(([id, data]) => ({ ...data, client: clients.find(c => c.id === id) }))
      .sort((a, b) => b.weight - a.weight);

    return {
      totalWeight,
      totalEarnings,
      totalDues,
      topClients: clientRanking.slice(0, 3)
    };
  }, [filteredLedger, clients]);

  const exportCSV = () => {
    if (filteredLedger.length === 0) return;

    const headers = ['Client Name', 'Date', 'Weight (KG)', 'Rate', 'Total', 'Paid', 'Pending'];
    const rows = filteredLedger.map(l => {
      const client = clients.find(c => c.id === l.clientId);
      return [
        `"${client?.fullName || 'Unknown'}"`,
        l.date,
        l.weight.toFixed(2),
        l.rate,
        l.totalValuation,
        l.amountPaid,
        l.outstandingBalance
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Try native share if possible (mobile first app)
    if (navigator.share) {
       const file = new File([blob], `Report_${range}_${format(new Date(), 'yyyyMMdd')}.csv`, { type: 'text/csv' });
       navigator.share({
         files: [file],
         title: 'Production Report',
         text: `Report for ${range} - Total Weight: ${reportStats.totalWeight.toFixed(2)} KG`
       }).catch(() => {
         // Fallback to direct download
         const link = document.createElement('a');
         link.href = url;
         link.setAttribute('download', `Report_${range}.csv`);
         link.click();
       });
    } else {
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `Report_${range}.csv`);
       link.click();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <Heading>Financial Reports</Heading>
          <Subtext>Performance analysis</Subtext>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-stone-900 dark:bg-stone-800 text-white p-3 rounded-2xl flex items-center gap-2 hover:bg-stone-800 active:scale-95 transition-all"
        >
          <FileDown size={20} />
        </button>
      </header>

      {/* Time Range Selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['today', '7days', 'month', 'year', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={cn(
              "p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
              range === t 
                ? "bg-[#2D5A27] text-white border-[#2D5A27] shadow-lg shadow-[#2D5A27]/20" 
                : "bg-white dark:bg-stone-900 text-stone-400 border-stone-100 dark:border-stone-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Metric 
          label="Processed Volume" 
          value={`${reportStats.totalWeight.toFixed(1)}`} 
          subValue="KILOGRAMS"
          icon={TrendingUp} 
          colorClass="bg-[#E9F3E8] text-[#2D5A27]"
        />
        <Metric 
          label="Expected Revenue" 
          value={formatCurrency(reportStats.totalEarnings, settings.currencySymbol)} 
          icon={FileSpreadsheet} 
          colorClass="bg-[#FDFBF7] text-[#5C4033] border border-stone-100"
        />
      </div>

      {/* Status Breakdown */}
      <Card className="bg-[#2D5A27] dark:bg-[#1e3b1a] text-white border-0">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2"><ArrowUpRight size={18} /> Balance Sheet</h3>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full uppercase italic">Computed</span>
         </div>
         <div className="space-y-4">
            <div className="flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-bold text-white/60 uppercase">Total Revenue</p>
                 <p className="text-2xl font-black">{formatCurrency(reportStats.totalEarnings, settings.currencySymbol)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-white/60 uppercase">Outstanding</p>
                 <p className="text-lg font-bold text-red-300">{formatCurrency(reportStats.totalDues, settings.currencySymbol)}</p>
               </div>
            </div>
            {/* Progress Bar Style Visualization */}
            <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
               <div 
                 className="h-full bg-white/80" 
                 style={{ width: `${(reportStats.totalEarnings - reportStats.totalDues) / reportStats.totalEarnings * 100}%` }} 
               />
            </div>
            <p className="text-[10px] text-white/50 text-center font-bold">
              {((reportStats.totalEarnings - reportStats.totalDues) / reportStats.totalEarnings * 100 || 0).toFixed(1)}% PAYMENTS COMPLETED
            </p>
         </div>
      </Card>

      {/* Top Performing Clients */}
      <div>
        <Heading className="text-lg mb-3">Top Contributors</Heading>
        <div className="space-y-3">
          {reportStats.topClients.map((item, idx) => (
            <div key={item.client?.id}>
              <Card className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-black text-xs text-stone-500">
                    #{idx + 1}
                 </div>
                 <div>
                    <h4 className="font-bold text-sm tracking-tight">{item.client?.fullName}</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">{item.weight.toFixed(1)} KG processed</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="font-black text-sm">{formatCurrency(item.earnings, settings.currencySymbol)}</p>
                 <ChevronRight size={14} className="text-stone-300 ml-auto" />
              </div>
            </Card>
          </div>
        ))}
          {reportStats.topClients.length === 0 && (
            <p className="text-center py-10 text-stone-400 text-sm italic">Insufficient data for ranking.</p>
          )}
        </div>
      </div>
    </div>
  );
};
