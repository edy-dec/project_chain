import React from 'react';
import { classNames } from '../../utils/formatters';
import './Badge.css';

const Badge = ({ children, color = 'default', size = 'sm', dot = false }) => (
  <span className={classNames('badge', `badge-${color}`, `badge-${size}`, dot && 'badge-dot-wrap')}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

export default Badge;
