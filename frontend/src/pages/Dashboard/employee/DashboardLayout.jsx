import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatBot } from './ChatBot';
import { ThemeProvider } from './ThemeContext';
import { useAuth } from '../../../context/AuthContext';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = useAuth();

  if (loading) {
    const lang = localStorage.getItem('chain-lang') || 'RO';
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <span className="text-dash-text-muted" style={{ fontSize: '13px' }}>
          {lang === 'RO' ? 'Se încarcă...' : 'Loading...'}
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
