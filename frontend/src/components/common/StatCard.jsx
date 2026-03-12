import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend = null }) => (
  <div className={`stat-card stat-card-${color}`}>
    <div className="stat-card-body">
      <div className="stat-card-info">
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value">{value}</p>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        {trend !== null && (
          <p className={`stat-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      {icon && <div className="stat-card-icon">{icon}</div>}
    </div>
  </div>
);

export default StatCard;
