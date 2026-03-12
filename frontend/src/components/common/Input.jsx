import React from 'react';
import { classNames } from '../../utils/formatters';
import './Input.css';

const Input = React.forwardRef(({
  label, error, hint, icon, id, className = '', required, ...rest
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={classNames('input-group', error && 'input-error', className)}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input ref={ref} id={inputId} className={classNames('input-field', icon && 'input-has-icon')} {...rest} />
      </div>
      {error && <p className="input-error-msg">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({ label, error, hint, id, options = [], className = '', required, placeholder, ...rest }, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={classNames('input-group', error && 'input-error', className)}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <select ref={ref} id={selectId} className="input-field select-field" {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="input-error-msg">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = React.forwardRef(({ label, error, hint, id, className = '', required, ...rest }, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={classNames('input-group', error && 'input-error', className)}>
      {label && <label htmlFor={textareaId} className="input-label">{label}{required && <span className="input-required">*</span>}</label>}
      <textarea ref={ref} id={textareaId} className="input-field" rows={4} {...rest} />
      {error && <p className="input-error-msg">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
