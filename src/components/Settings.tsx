import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Database, 
  Trash2, 
  ShieldAlert,
  Info,
  ChevronRight,
  Globe,
  Bell,
  RefreshCw,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  LogOut,
  User as UserIcon,
  Link as LinkIcon,
  Download
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, Heading, Subtext } from './ui/Shared';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';
import { motion, AnimatePresence } from 'motion/react';
import { PasscodeModal } from './ui/PasscodeModal';
import { initAuth, googleSignIn, logout as googleLogout } from '../services/authService';
import { exportToSheets } from '../services/sheetsService';
import { User } from 'firebase/auth';

export const Settings: React.FC<{ onOpenAbout: () => void }> = ({ onOpenAbout }) => {
  const { clients, ledger, settings, setTheme, setCurrency, setPasscode, admins, addAdmin, deleteAdmin, seedDemoData, resetAll } = useData();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showPasscodeAuth, setShowPasscodeAuth] = useState<{ type: 'wipe' | 'setup' | 'disable' | 'verify_change', tempPasscode?: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ id?: string; url?: string; error?: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = initAuth((u) => setUser(u));

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    hapticFeedback.medium();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSyncStatus(null);
      hapticFeedback.medium();
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        hapticFeedback.success();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setSyncStatus({ error: 'Auth cancelled. Keep the popup open to sign in.' });
      } else {
        setSyncStatus({ error: 'Sign-in failed. Check pop-up blocker settings.' });
      }
      hapticFeedback.error();
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncStatus(null);
    hapticFeedback.medium();
    
    try {
      const result = await exportToSheets({ clients, ledger });
      setSyncStatus({ id: result.spreadsheetId, url: result.spreadsheetUrl });
      hapticFeedback.success();
    } catch (err: any) {
      setSyncStatus({ error: err.message });
      hapticFeedback.error();
    } finally {
      setIsSyncing(false);
    }
  };

  const currencies = [
    { label: 'INR (₹)', value: '₹' },
    { label: 'USD ($)', value: '$' },
    { label: 'GBP (£)', value: '£' },
    { label: 'EUR (€)', value: '€' },
  ];

  const handleSeed = () => {
    setIsSeeding(true);
    setTimeout(() => {
      seedDemoData();
      setIsSeeding(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <header>
        <Heading>Settings</Heading>
        <Subtext>Control & configuration</Subtext>
      </header>

      {/* About CTA */}
      <Card 
        className="flex items-center justify-between bg-primary text-white border-none shadow-xl shadow-primary/20 p-6 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => {
          hapticFeedback.medium();
          onOpenAbout();
        }}
      >
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
               <Info size={28} strokeWidth={3} />
            </div>
            <div>
               <h3 className="font-black text-xl uppercase tracking-tighter">About System</h3>
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Version & Factory Info</p>
            </div>
         </div>
         <ChevronRight size={20} strokeWidth={3} className="opacity-40" />
      </Card>

      {/* Cloud & Integration */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Cloud Services</h3>
        <Card className="p-6">
          {!user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Cloud Backup</h4>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Sync with Google Services</p>
                </div>
              </div>
              <button 
                onClick={handleGoogleSignIn}
                className="w-full h-14 bg-white border-2 border-stone-100 dark:border-stone-800 dark:bg-stone-900 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
              >
                <div className="w-6 h-6">
                   <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M0 0h24v24H0z"/></svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">Sign in with Google</span>
              </button>
              <p className="text-[9px] text-center text-stone-400 font-bold uppercase tracking-tighter px-4">
                Note: Ensure pop-ups are allowed for this site to sign in properly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-primary/10" referrerPolicy="no-referrer" />
                     <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{user.displayName}</p>
                        <p className="text-[8px] font-bold text-stone-400 truncate max-w-[120px]">{user.email}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => {
                      hapticFeedback.light();
                      googleLogout();
                      setUser(null);
                    }}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
               </div>

               <div className="space-y-3">
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={cn(
                      "w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-lg",
                      isSyncing ? "bg-stone-100 text-stone-400" : "bg-green-600 text-white shadow-green-600/20 active:scale-95"
                    )}
                  >
                    {isSyncing ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <FileSpreadsheet size={20} />
                    )}
                    {isSyncing ? 'Exporting...' : 'Export to Google Sheets'}
                  </button>

                  <AnimatePresence>
                    {syncStatus && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-center",
                          syncStatus.error ? "border-red-100 bg-red-50 text-red-600" : "border-green-100 bg-green-50 text-green-600"
                        )}
                      >
                        {syncStatus.error ? (
                          <p className="text-[10px] font-black uppercase tracking-wider">{syncStatus.error}</p>
                        ) : (
                          <div className="space-y-2 text-center">
                            <p className="text-[10px] font-black uppercase tracking-wider">Spreadsheet Created Successfully</p>
                            <a 
                              href={syncStatus.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:translate-y-[-2px] transition-all"
                            >
                              <LinkIcon size={14} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Open Spreadsheet</span>
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          )}
        </Card>
      </section>

      {/* App Installation */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Mobile Application</h3>
        <Card className="p-6 overflow-hidden relative group border-2 border-stone-100">
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                 <Download size={28} strokeWidth={3} />
              </div>
              <div className="flex-1">
                 <h4 className="font-black text-lg uppercase tracking-tighter leading-tight">Install Full App</h4>
                 <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Offline-Ready Experience</p>
              </div>
              <button 
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className={cn(
                  "px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  deferredPrompt 
                    ? "bg-primary text-white shadow-lg shadow-primary/10 active:scale-95" 
                    : "bg-stone-50 text-stone-300"
                )}
              >
                {deferredPrompt ? 'Install Now' : 'Installed'}
              </button>
           </div>
           
           {!deferredPrompt && (
             <div className="mt-6 p-4 rounded-2xl bg-stone-50 border-stone-100 border text-stone-500">
                <p className="text-[10px] font-bold leading-relaxed">
                  <span className="text-primary font-black uppercase text-[11px] block mb-1">Manual Installation Guide:</span>
                  If "Install" is button is disabled, you can still install it by going to your browser menu and selecting 
                  <span className="text-stone-700 font-black"> "Add to Home Screen"</span> or 
                  <span className="text-stone-700 font-black"> "Install App"</span>.
                </p>
             </div>
           )}
           
           <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-primary rotate-12">
              <RefreshCw size={140} />
           </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Security & Privacy</h3>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-primary">
                <ShieldAlert size={20} />
              </div>
              <div>
                <span className="font-bold text-sm block">System Passcode</span>
                <p className="text-[9px] text-stone-400 font-bold uppercase">{settings.passcode ? 'PROTECTION ACTIVE' : 'NO PASSCODE SET'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {settings.passcode ? (
                <>
                  <button 
                    onClick={() => {
                      hapticFeedback.medium();
                      setShowPasscodeAuth({ type: 'verify_change' });
                    }}
                    className="px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Change
                  </button>
                  <button 
                    onClick={() => {
                      hapticFeedback.medium();
                      setShowPasscodeAuth({ type: 'disable' });
                    }}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Disable
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    hapticFeedback.medium();
                    setShowPasscodeAuth({ type: 'setup' });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Admin Section</h3>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-primary">
                <UserIcon size={20} />
              </div>
              <div>
                <span className="font-bold text-sm block">System Administrators</span>
                <p className="text-[9px] text-stone-400 font-bold uppercase">AUTHORIZED ROSTER</p>
              </div>
            </div>
            
            {admins && admins.length > 0 ? (
              <div className="space-y-2">
                {admins.map((adminName, index) => (
                  <div key={index} className="flex justify-between items-center py-2.5 px-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800">
                    <span className="text-xs font-black uppercase text-primary tracking-tight">{adminName}</span>
                    <button 
                      onClick={() => {
                        hapticFeedback.light();
                        deleteAdmin(adminName);
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      title="Remove Admin"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 font-medium italic pl-1">No custom admin names registered yet.</p>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('adminName')?.toString().trim();
              if (name) {
                hapticFeedback.success();
                addAdmin(name);
                e.currentTarget.reset();
              }
            }} className="flex gap-2">
              <input 
                name="adminName"
                placeholder="Enter admin name..."
                required
                className="flex-1 bg-stone-50 dark:bg-stone-800/60 px-4 py-2.5 rounded-xl text-xs font-bold outline-none border border-stone-100 dark:border-stone-800/80 focus:border-stone-300 transition-colors placeholder:text-stone-400 placeholder:opacity-60 text-primary"
              />
              <button 
                type="submit"
                className="px-4 py-2.5 bg-primary text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
              >
                Add
              </button>
            </form>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Visual Experience</h3>
        <Card className="p-0 overflow-hidden divide-y divide-stone-50 dark:divide-stone-800">
           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
                   {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                 </div>
                 <span className="font-bold text-sm">Theme Mode</span>
              </div>
              <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                 {(['light', 'dark'] as const).map(m => (
                   <button
                     key={m}
                     onClick={() => setTheme(m)}
                     className={cn(
                       "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                       settings.theme === m ? "bg-white dark:bg-stone-700 shadow-sm" : "text-stone-400"
                     )}
                   >
                     {m}
                   </button>
                 ))}
              </div>
           </div>

           <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
                   <Globe size={20} />
                 </div>
                 <span className="font-bold text-sm">Currency Symbol</span>
              </div>
              <select 
                value={settings.currencySymbol}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-stone-100 dark:bg-stone-800 px-3 py-2 rounded-xl text-xs font-bold outline-none border-0"
              >
                {currencies.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
           </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">App Maintenance</h3>
        <button 
          onClick={() => {
            if (settings.passcode) {
              setShowPasscodeAuth({ type: 'wipe' });
            } else {
              setShowConfirmReset(true);
            }
          }}
          className="w-full bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all text-red-600"
        >
          <div className="flex items-center gap-4">
             <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                <Trash2 size={24} />
             </div>
             <div className="text-left">
                <span className="text-sm font-black uppercase tracking-tight block">Wipe All Data</span>
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest leading-none">Delete everything permanently</span>
             </div>
          </div>
          <ChevronRight size={20} className="opacity-40" />
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">App Info</h3>
        <Card className="divide-y divide-stone-50 dark:divide-stone-800 p-0">
           <div className="p-4 flex justify-between items-center text-sm font-bold">
              <span className="flex items-center gap-2 text-stone-500"><Info size={18} /> Version</span>
              <span className="text-stone-300">1.0.0 Stable</span>
           </div>
           <div className="p-4 flex justify-between items-center text-sm font-bold">
              <span className="flex items-center gap-2 text-stone-500"><ShieldAlert size={18} /> Security</span>
              <span className="text-stone-300">Offline Local Storage</span>
           </div>
           <div className="p-4 flex justify-between items-center text-sm font-bold">
              <span className="flex items-center gap-2 text-stone-500"><RefreshCw size={18} /> Engine</span>
              <span className="text-stone-300">React + Vite v6</span>
           </div>
        </Card>
      </section>

      <div className="text-center py-6">
         <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em]">Built for Supari Excellence</p>
      </div>

      <AnimatePresence>
        {showPasscodeAuth && (
          <PasscodeModal 
            isOpen={true}
            setupMode={showPasscodeAuth.type === 'setup'}
            correctPasscode={showPasscodeAuth.type === 'setup' ? undefined : settings.passcode}
            title={
              showPasscodeAuth.type === 'setup' ? "Set New Passcode" : 
              showPasscodeAuth.type === 'wipe' ? "Identity Verification" :
              showPasscodeAuth.type === 'verify_change' ? "Change Passcode" :
              "Disable Passcode"
            }
            subtext={
              showPasscodeAuth.type === 'setup' ? "Create a 4-digit security code" : 
              showPasscodeAuth.type === 'verify_change' ? "Enter your current passcode" :
              "Enter your existing passcode"
            }
            onSuccess={(capturedCode) => {
              if (showPasscodeAuth.type === 'setup' && capturedCode) {
                setPasscode(capturedCode);
              } else if (showPasscodeAuth.type === 'disable') {
                setPasscode(undefined);
              } else if (showPasscodeAuth.type === 'wipe') {
                setShowConfirmReset(true);
              } else if (showPasscodeAuth.type === 'verify_change') {
                // Verified old passcode, now show setup for new one
                setShowPasscodeAuth({ type: 'setup' });
                return; // Don't nullify yet
              }
              setShowPasscodeAuth(null);
            }}
            onCancel={() => setShowPasscodeAuth(null)}
          />
        )}

        {showConfirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" 
               onClick={() => setShowConfirmReset(false)} 
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white dark:bg-stone-900 rounded-[32px] w-full max-w-xs overflow-hidden relative shadow-2xl p-8 text-center"
             >
                <div className="w-16 h-16 bg-red-100 dark:bg-stone-800 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black mb-2">Dangerous Action</h3>
                <p className="text-sm text-stone-500 mb-8 font-medium">This will permanently delete ALL clients, ledgers, and settings. This cannot be undone.</p>
                
                <div className="space-y-3">
                   <button 
                     onClick={() => {
                       resetAll();
                       setShowConfirmReset(false);
                     }}
                     className="w-full h-14 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/20"
                   >
                     Clear Everything
                   </button>
                   <button 
                     onClick={() => setShowConfirmReset(false)}
                     className="w-full h-14 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-2xl font-black text-sm uppercase tracking-widest"
                   >
                     Keep My Data
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
