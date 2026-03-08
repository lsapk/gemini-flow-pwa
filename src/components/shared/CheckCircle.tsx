import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckCircleProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'primary';
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function CheckCircle({
  checked,
  onChange,
  size = 'md',
  variant = 'success',
  disabled = false,
  className,
}: CheckCircleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative rounded-full border-2 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 active:scale-90',
        sizeClasses[size],
        {
          'border-muted-foreground/20 hover:border-muted-foreground/40 bg-transparent': !checked,
          'border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600 shadow-[0_0_12px_rgba(34,197,94,0.3)]': checked && variant === 'success',
          'border-primary bg-primary hover:bg-primary/90 shadow-[0_0_12px_hsl(var(--primary)/0.3)]': checked && variant === 'primary',
          'opacity-50 cursor-not-allowed': disabled,
          'cursor-pointer': !disabled,
        },
        className
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center justify-center"
          >
            <Check className={cn('text-white', iconSizes[size])} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ripple effect on check */}
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-green-400"
          />
        )}
      </AnimatePresence>
    </button>
  );
}
