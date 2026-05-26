import { Info, Phone, User, ShieldCheck } from 'lucide-react';
import { Card, Heading, Subtext } from './ui/Shared';
import { motion } from 'motion/react';
import { hapticFeedback } from '../lib/haptics';
import { developerInfo } from '../constants';

export const About = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-32"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={() => {
            hapticFeedback.light();
            onBack();
          }}
          className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-primary"
        >
          <Info size={24} strokeWidth={3} />
        </button>
        <div>
          <Heading>System Info</Heading>
          <Subtext>About your application</Subtext>
        </div>
      </header>

      {/* Developer Profile */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] ml-2">Lead Developer</h3>
        <Card className="relative overflow-hidden group border-2 border-primary/10">
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <User size={28} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-0.5">Architect & Creator</p>
              <h4 className="text-xl font-black text-primary uppercase tracking-tighter leading-tight">{developerInfo.name}</h4>
              <p className="text-[9px] font-bold text-primary opacity-40 uppercase tracking-tighter italic">@sudip_halder</p>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-[0.02] text-primary">
            <User size={120} />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
         <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] ml-2">Contact Support</h3>
         <Card className="p-0 overflow-hidden divide-y divide-stone-50 dark:divide-stone-800">
            <a href="mailto:halder055sh@gmail.com" className="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                    <User size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest">Email Developer</p>
                    <p className="font-black text-primary lowercase truncate max-w-[150px]">halder055sh@gmail.com</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full border-2 border-primary/5 flex items-center justify-center text-primary/20">
                  <ShieldCheck size={18} strokeWidth={3} />
               </div>
            </a>
            <a href="tel:+" className="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <Phone size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest">Support Line</p>
                    <p className="font-black text-primary uppercase">Direct Contact</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full border-2 border-primary/5 flex items-center justify-center text-primary/20">
                  <User size={18} strokeWidth={3} />
               </div>
            </a>
         </Card>
      </section>

      <footer className="py-10 text-center opacity-40">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Supari Management System</p>
        <p className="text-[9px] font-bold text-accent uppercase">Version 2.4.0 Alpha • Build 1705</p>
      </footer>
    </motion.div>
  );
};

