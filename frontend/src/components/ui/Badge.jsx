import { cn } from '../../utils/cn';

const variants = {
  default:     'bg-primary/10 text-primary border-transparent',
  secondary:   'bg-secondary text-secondary-foreground border-transparent',
  destructive: 'bg-destructive/10 text-destructive border-transparent',
  outline:     'border border-border text-foreground',
  success:     'bg-success/10 text-success border-transparent',
  warning:     'bg-warning/10 text-warning border-transparent',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
