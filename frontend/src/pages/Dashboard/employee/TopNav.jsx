import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useT } from '../../../i18n/useT';
import { Sun, Moon, Bell, ChevronDown, LogOut, User, Globe, Menu } from 'lucide-react';

const NOTIFS = {
  RO: [
    { id: 1, text: 'Pontajul tău de intrare a fost înregistrat la 09:00', time: '1 oră',  unread: true  },
    { id: 2, text: 'Cererea de concediu a fost aprobată (3 zile)',         time: '3 ore',  unread: true  },
    { id: 3, text: 'Salariul pentru Martie a fost procesat',               time: '1 zi',   unread: false },
  ],
  EN: [
    { id: 1, text: 'Your clock-in was recorded at 09:00',  time: '1h ago', unread: true  },
    { id: 2, text: 'Leave request approved for 3 days',    time: '3h ago', unread: true  },
    { id: 3, text: 'March salary has been processed',       time: '1d ago', unread: false },
  ],
};

export function TopNav({ title }) {
  const { theme, toggleTheme, lang, toggleLang, toggleMobileSidebar } = useTheme();
  const t = useT(lang);
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState(NOTIFS[lang] || NOTIFS.RO);
  const menuRef  = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => { setNotifications(NOTIFS[lang] || NOTIFS.RO); }, [lang]);

  const name = currentUser?.name || currentUser?.email || 'User';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-14 flex items-center justify-between px-4 sm:px-6 bg-dash-card border-b border-dash-border sticky top-0 z-30 transition-colors duration-200 gap-3">
      {/* Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors shrink-0"
          title="Menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-dash-text truncate" style={{ fontSize: '16px', fontWeight: 600 }}>{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
          title={theme === 'dark' ? t('topnav.lightMode') : t('topnav.darkMode')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
          title={lang === 'RO' ? t('topnav.switchEN') : t('topnav.switchRO')}
        >
          <Globe size={15} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
            title={t('topnav.notifications')}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] bg-dash-primary rounded-full" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 bg-dash-card border border-dash-border rounded-lg shadow-lg z-50 w-[calc(100vw-1.5rem)] max-w-[300px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border">
                <p className="text-dash-text" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {t('topnav.notifications')}
                </p>
                {unreadCount > 0 && (
                  <span className="text-dash-primary" style={{ fontSize: '11px', fontWeight: 500 }}>
                    {unreadCount} {t('topnav.unread')}
                  </span>
                )}
              </div>
              <ul style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                    className={`px-4 py-3 border-b border-dash-border last:border-0 cursor-pointer hover:bg-dash-sidebar-hover ${n.unread ? 'bg-dash-primary-light/40' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-dash-primary shrink-0" />}
                      <div style={{ paddingLeft: n.unread ? '0' : '10px' }}>
                        <p className="text-dash-text-secondary leading-snug" style={{ fontSize: '12px' }}>{n.text}</p>
                        <p className="text-dash-text-muted mt-0.5" style={{ fontSize: '11px' }}>{n.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 border-t border-dash-border">
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                  className="text-dash-primary hover:underline"
                  style={{ fontSize: '11px' }}
                >
                  {t('topnav.markAllRead')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1.5 sm:pl-2 pr-1.5 py-1 rounded-md hover:bg-dash-sidebar-hover transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-dash-primary text-white flex items-center justify-center" style={{ fontSize: '11px', fontWeight: 700 }}>
              {initials}
            </div>
            <span className="hidden sm:inline text-dash-text-secondary" style={{ fontSize: '13px' }}>
              {name.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-dash-text-muted" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-dash-card border border-dash-border rounded-lg shadow-lg py-1 z-50">
              <a
                href="/dashboard/profile"
                className="flex items-center gap-2 px-3 py-2 text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
                style={{ fontSize: '13px' }}
              >
                <User size={14} />
                {t('topnav.myProfile')}
              </a>
              <hr className="my-1 border-dash-border" />
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                style={{ fontSize: '13px' }}
              >
                <LogOut size={14} />
                {t('topnav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
