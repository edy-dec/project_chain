import { Children, createContext, isValidElement, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const SelectCtx = createContext(null);

function extractText(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }

  if (isValidElement(node)) {
    return extractText(node.props?.children);
  }

  return '';
}

export function Select({ value, onValueChange, children, disabled }) {
  const [open, setOpen] = useState(false);
  const [optionLabels, setOptionLabels] = useState({});
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

  const registerOption = (v, label) => {
    const nextLabel = label ?? String(v);
    setOptionLabels((prev) => (prev[v] === nextLabel ? prev : { ...prev, [v]: nextLabel }));
  };

  return (
    <SelectCtx.Provider value={{ value, open, setOpen, handleSelect, registerOption, optionLabels, disabled }}>
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
        'flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm',
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
  const hasValue = ctx.value !== undefined && ctx.value !== null && ctx.value !== '';
  const display = hasValue ? (ctx.optionLabels[ctx.value] ?? ctx.value) : placeholder;
  return (
    <span className={hasValue ? 'text-foreground' : 'text-muted-foreground'}>
      {display}
    </span>
  );
}

export function SelectContent({ className, children }) {
  const ctx = useContext(SelectCtx);
  return (
    <div
      aria-hidden={!ctx.open}
      className={cn(
        'absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-card shadow-md',
        !ctx.open && 'pointer-events-none invisible opacity-0',
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

  useEffect(() => {
    const extractedLabel = extractText(Children.toArray(children)).replace(/\s+/g, ' ').trim();
    const label = extractedLabel || String(value);
    ctx.registerOption?.(value, label);
  }, [ctx, value, children]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => ctx.handleSelect(value)}
      className={cn(
        'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-primary/5 text-primary font-medium',
        className
      )}
    >
      {children}
    </div>
  );
}
