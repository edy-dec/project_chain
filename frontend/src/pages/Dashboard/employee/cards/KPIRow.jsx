import React from 'react';

export function KPIRow({ cards }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-dash-card border border-dash-border rounded-xl p-4 flex flex-col gap-3 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-dash-text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>
              {card.label}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg || 'bg-dash-primary/10'}`}>
              {card.icon && <card.icon size={16} className={card.iconColor || 'text-dash-primary'} strokeWidth={1.8} />}
            </div>
          </div>
          <div>
            <p className="text-dash-text" style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
              {card.value}
            </p>
            {card.sub && (
              <p className={`mt-1 ${card.subColor || 'text-dash-text-muted'}`} style={{ fontSize: '11px' }}>
                {card.sub}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
