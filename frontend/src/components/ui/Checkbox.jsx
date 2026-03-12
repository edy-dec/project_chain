import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Checkbox({ checked, onCheckedChange, disabled, className }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded border border-border shadow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary border-primary text-primary-foreground' : 'bg-card',
        className
      )}
    >
      {checked && <Check className="size-3 text-white" />}
    </button>
  );
}
