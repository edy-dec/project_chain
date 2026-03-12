import React from 'react';
import './Alert.css';

const ICONS = { success: '✓', warning: '⚠', danger: '✕', info: 'ℹ' };

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="alert-icon">{ICONS[type]}</span>
      <span className="alert-message">{message}</span>
      {onClose && <button className="alert-close" onClick={onClose} aria-label="Dismiss">×</button>}
    </div>
  );
};

export default Alert;
