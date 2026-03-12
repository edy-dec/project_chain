import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const SelectCtx = createContext(null);

export function Select({ value, onValueChange, children, disabled }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (v) => {
    onValueChange?.(v);
    setOpen(false);
  };

  return (
    <SelectCtx.Provider value={{ value, open, setOpen, handleSelect, disabled }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className, children }) {
  const ctx = useContext(SelectCtx);
  return (
    <button
      type="button"
      disabled={ctx.disabled}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
      <ChevronDown className="ml-2 size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const ctx = useContext(SelectCtx);
  return (
    <span className={ctx.value ? 'text-foreground' : 'text-muted-foreground'}>
      {ctx.value || placeholder}
    </span>
  );
}

export function SelectContent({ className, children }) {
  const ctx = useContext(SelectCtx);
  if (!ctx.open) return null;
  return (
    <div
      className={cn(
        'absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-card shadow-md',
        className
      )}
    >
      <div className="py-1 max-h-60 overflow-y-auto">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children, className }) {
  const ctx = useContext(SelectCtx);
  const isSelected = ctx.value === value;
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => ctx.handleSelect(value)}
      className={cn(
        'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-primary/5 text-primary font-medium',
        className
      )}
    >
      {children}
    </div>
  );
}
