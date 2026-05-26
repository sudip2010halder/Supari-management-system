import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Heading, Subtext } from './Shared';
import { hapticFeedback } from '../../lib/haptics';

interface PasscodeModalProps {
  isOpen: boolean;
  onSuccess: (capturedCode?: string) => void;
  onCancel?: () => void;
  correctPasscode?: string;
  title?: string;
  subtext?: string;
  isLockScreen?: boolean;
  setupMode?: boolean;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ 
  isOpen, 
  onSuccess, 
  onCancel, 
  correctPasscode, 
  title = "Authentication Required", 
  subtext = "Enter passcode to proceed",
  isLockScreen = false,
  setupMode = false
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code.length === 4) {
      if (setupMode) {
        hapticFeedback.success();
        onSuccess(code);
        setCode('');
      } else if (code === correctPasscode) {
        hapticFeedback.success();
        onSuccess();
        setCode('');
      } else {
        hapticFeedback.error();
        setError(true);
        setTimeout(() => {
          setError(false);
          setCode('');
        }, 500);
      }
    }
  }, [code, correctPasscode, onSuccess, setupMode]);

  const handleKeyPress = (num: number) => {
    if (code.length < 4) {
      hapticFeedback.light();
      setCode(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    hapticFeedback.light();
    setCode(prev => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isLockScreen ? 'bg-primary' : ''}`}>
      {!isLockScreen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-stone-900/80 backdrop-blur-xl" 
          onClick={onCancel}
        />
      )}
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-sm px-6 relative"
      >
        <div className="bg-white dark:bg-stone-900 rounded-[40px] p-8 shadow-2xl text-center border border-stone-100 dark:border-stone-800">
          <div className="w-16 h-16 rounded-3xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          
          <Heading className="mb-2">{title}</Heading>
          <Subtext className="mb-8">{subtext}</Subtext>

          <div className="flex justify-center gap-3 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  error ? 'bg-error-base animate-shake' : 
                  code.length > i ? 'bg-green-600 scale-125' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-16 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xl font-black hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKeyPress(0)}
              className="h-16 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xl font-black hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors active:scale-95"
            >
              <Delete size={24} />
            </button>
          </div>

          {!isLockScreen && (
            <button 
              onClick={onCancel}
              className="mt-8 text-[10px] font-black uppercase text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center gap-2 mx-auto"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
