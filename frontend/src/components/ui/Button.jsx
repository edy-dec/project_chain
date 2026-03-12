import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default:     'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline:     'border border-border bg-card shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary:   'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost:       'hover:bg-accent hover:text-accent-foreground',
  link:        'text-primary underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-9 px-4 py-2 text-sm',
  sm:      'h-8 px-3 py-1 text-xs rounded-md',
  lg:      'h-10 px-8 text-sm rounded-md',
  icon:    'h-8 w-8 p-0',
};

export const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
