import React from 'react';
import { classNames } from '../../utils/formatters';
import './Button.css';

const VARIANTS = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost', success: 'btn-success' };
const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    onClick={onClick}
    className={classNames('btn', VARIANTS[variant], SIZES[size], fullWidth && 'btn-full', loading && 'btn-loading', className)}
    {...rest}
  >
    {loading ? <span className="btn-spinner" /> : icon && <span className="btn-icon">{icon}</span>}
    {children}
  </button>
);

export default Button;
