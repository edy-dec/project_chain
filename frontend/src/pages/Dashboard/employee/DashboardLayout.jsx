import React, { useState } from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatBot } from './ChatBot';
import { ThemeProvider } from './ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import translations from '../../../i18n/translations';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { loading, refreshCurrentUser } = useAuth();

  useEffect(() => {
    refreshCurrentUser?.();
  }, [refreshCurrentUser]);

  if (loading) {
    const lang = localStorage.getItem('chain-lang') || 'RO';
    const loadingText = translations['dash.loading']?.[lang] || translations['dash.loading']?.RO || 'Se încarcă...';
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <span className="text-dash-text-muted" style={{ fontSize: '13px' }}>
          {loadingText}
        </span>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-dash-bg font-sans transition-colors duration-200">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div
          className="transition-all duration-300"
          style={{ marginLeft: collapsed ? '64px' : '240px' }}
        >
          <Outlet />
        </div>
        <ChatBot />
      </div>
    </ThemeProvider>
  );
}

export default DashboardLayout;
