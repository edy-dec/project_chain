import React, { useState } from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatBot } from './ChatBot';
import { ThemeProvider, useTheme } from './ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import translations from '../../../i18n/translations';

function DashboardShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { loading, refreshCurrentUser } = useAuth();
  const { closeMobileSidebar } = useTheme();

  useEffect(() => {
    refreshCurrentUser?.();
  }, [refreshCurrentUser]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) closeMobileSidebar();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [closeMobileSidebar]);

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
    <div className="min-h-screen bg-dash-bg font-sans transition-colors duration-200">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div
        className="transition-all duration-300 min-w-0"
        style={{ marginLeft: isMobile ? '0px' : (collapsed ? '64px' : '240px') }}
      >
        <Outlet />
      </div>
      <ChatBot />
    </div>
  );
}

export function DashboardLayout() {
  return (
    <ThemeProvider>
      <DashboardShell />
    </ThemeProvider>
  );
}

export default DashboardLayout;
