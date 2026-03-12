import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div className="relative z-10 w-full bg-card border border-border rounded-lg shadow-xl">
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col gap-4 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-base font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

export function DialogFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2', className)} {...props}>
      {children}
    </div>
  );
}
