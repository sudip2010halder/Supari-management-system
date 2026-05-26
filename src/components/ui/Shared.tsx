import React from 'react';
import { cn } from "../../lib/utils";

export const Card = ({ children, className, id, onClick }: { children: React.ReactNode; className?: string; id?: string; onClick?: () => void }) => (
  <div id={id} onClick={onClick} className={cn("bg-white dark:bg-stone-900 rounded-[32px] shadow-sm border border-primary/5 dark:border-stone-800 p-6", className)}>
    {children}
  </div>
);

export const Heading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-2xl font-black text-primary dark:text-stone-100 uppercase tracking-tighter", className)}>
    {children}
  </h2>
);

export const Subtext = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-[10px] font-bold uppercase tracking-widest text-accent opacity-80", className)}>
    {children}
  </p>
);

export const Metric = ({ label, value, subValue, icon: Icon, colorClass, highlight }: { label: string; value: string; subValue?: string; icon: any; colorClass?: string; highlight?: boolean }) => (
  <Card className={cn(
    "flex flex-col h-full", 
    highlight ? "bg-primary text-white border-none shadow-lg shadow-primary/20" : "bg-white"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        "p-2.5 rounded-2xl transition-colors", 
        highlight ? "bg-white/10 text-white" : colorClass || "bg-stone-50 dark:bg-stone-800 text-primary"
      )}>
        <Icon size={22} strokeWidth={3} />
      </div>
      {subValue && (
        <span className={cn(
          "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter",
          highlight ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-stone-800 text-accent"
        )}>
          {subValue}
        </span>
      )}
    </div>
    <div className="mt-auto">
      <p className={cn(
        "text-[10px] font-bold uppercase tracking-[0.2em] mb-1",
        highlight ? "text-white/60" : "text-accent"
      )}>
        {label}
      </p>
      <p className={cn(
        "text-2xl md:text-3xl font-black tracking-tighter leading-none break-all",
        highlight ? "text-white" : "text-primary"
      )}>
        {value}
      </p>
    </div>
  </Card>
);
