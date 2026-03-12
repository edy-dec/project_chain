import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Gift,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  Globe,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Theme context ──────────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: false, toggleDark: () => {}, lang: 'RO', toggleLang: () => {} });
export const useTheme = () => useContext(ThemeCtx);

// ── Nav items (bilingual) ──────────────────────────────────────────────────
const NAV_ITEMS = {
  EN: [
    { label: 'Overview',   to: '/admin',          icon: LayoutDashboard, end: true },
    { label: 'Employees',  to: '/admin/employees', icon: Users },
    { label: 'Shifts',     to: '/admin/shifts',    icon: Calendar },
    { label: 'Leave',      to: '/admin/leave',     icon: FileText },
    { label: 'Bonuses',    to: '/admin/bonuses',   icon: Gift },
    { label: 'Reports',    to: '/admin/reports',   icon: BarChart2 },
    { label: 'Settings',   to: '/admin/settings',  icon: Settings },
  ],
  RO: [
    { label: 'Prezentare', to: '/admin',          icon: LayoutDashboard, end: true },
    { label: 'Angajați',   to: '/admin/employees', icon: Users },
    { label: 'Schimburi',  to: '/admin/shifts',    icon: Calendar },
    { label: 'Concedii',   to: '/admin/leave',     icon: FileText },
    { label: 'Bonusuri',   to: '/admin/bonuses',   icon: Gift },
    { label: 'Rapoarte',   to: '/admin/reports',   icon: BarChart2 },
    { label: 'Setări',     to: '/admin/settings',  icon: Settings },
  ],
};

// ── Notifications data (bilingual) ────────────────────────────────────────
const NOTIFS_DATA = {
  EN: [
    { id: 1, text: 'Maria Pop requested 3 days vacation leave',               time: '10m ago', unread: true  },
    { id: 2, text: 'Ion Ionescu clocked in at 08:54',                         time: '1h ago',  unread: true  },
    { id: 3, text: 'March payroll processed – 45,200 RON total',              time: '2h ago',  unread: false },
  ],
  RO: [
    { id: 1, text: 'Maria Pop a solicitat 3 zile concediu de odihnă',        time: '10 min',  unread: true  },
    { id: 2, text: 'Ion Ionescu a înregistrat intrarea la 08:54',            time: '1 oră',   unread: true  },
    { id: 3, text: 'Salariile pentru Martie au fost procesate – 45.200 RON', time: '2 ore',   unread: false },
  ],
};

// ── Main Layout ────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [collapsed, setCollapsed]         = useState(false);
  const [dark, setDark]                   = useState(() => localStorage.getItem('chain-theme') === 'dark');
  const [lang, setLang]                   = useState(() => localStorage.getItem('chain-lang') || 'RO');
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState(() => NOTIFS_DATA[localStorage.getItem('chain-lang') || 'RO']);
  const { user, logout } = useAuth0();
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleDark = () => setDark((d) => {
    const next = !d;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('chain-theme', next ? 'dark' : 'light');
    return next;
  });

  const toggleLang = () => setLang((l) => {
    const next = l === 'EN' ? 'RO' : 'EN';
    localStorage.setItem('chain-lang', next);
    setNotifications(NOTIFS_DATA[next]);
    return next;
  });

  const navItems    = NAV_ITEMS[lang] || NAV_ITEMS.RO;
  const unreadCount = notifications.filter((n) => n.unread).length;
  const initials    = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <ThemeCtx.Provider value={{ dark, toggleDark, lang, toggleLang }}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0',
            collapsed ? 'w-16' : 'w-56'
          )}
        >
          {/* Logo */}
          <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                <Building2 className="size-4 text-white" />
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm text-sidebar-foreground truncate">
                  Chain Admin
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors shrink-0"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 h-9 px-3 mx-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-sidebar-primary rounded-full" />
                    )}
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom: user info */}
          {!collapsed && (
            <div className="px-3 py-3 border-t border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs text-white font-medium shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main area ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top Nav */}
          <header className="flex items-center h-14 px-4 border-b border-border bg-card shrink-0 gap-3">
            {/* Page title auto via breadcrumb - just show company */}
            <span className="text-sm font-medium text-muted-foreground">Chain Technologies SRL</span>
            <div className="flex-1" />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                className="relative p-2 rounded-md hover:bg-accent text-muted-foreground"
                title={lang === 'RO' ? 'Notificări' : 'Notifications'}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-[7px] bg-primary rounded-full" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">{lang === 'RO' ? 'Notificări' : 'Notifications'}</p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-primary font-medium">
                        {unreadCount} {lang === 'RO' ? 'necitite' : 'unread'}
                      </span>
                    )}
                  </div>
                  <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn('px-4 py-3 hover:bg-accent cursor-pointer', n.unread && 'bg-primary/5')}
                        onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                      >
                        <div className="flex items-start gap-2">
                          {n.unread && <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />}
                          <div className={cn('flex-1', !n.unread && 'pl-3.5')}>
                            <p className="text-xs text-foreground leading-snug">{n.text}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-2 border-t border-border">
                    <button
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                      className="text-xs text-primary hover:underline"
                    >
                      {lang === 'RO' ? 'Marchează toate ca citite' : 'Mark all as read'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground"
              title={dark ? (lang === 'RO' ? 'Mod luminos' : 'Light mode') : (lang === 'RO' ? 'Mod întunecat' : 'Dark mode')}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 p-2 rounded-md hover:bg-accent text-muted-foreground text-xs font-medium"
              title={lang === 'RO' ? 'Switch to English' : 'Schimbă în Română'}
            >
              <Globe className="size-4" />
              {lang}
            </button>

            {/* Avatar dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent text-sm"
              >
                <div className="size-7 rounded-full bg-primary flex items-center justify-center text-xs text-white font-medium">
                  {initials}
                </div>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-md z-50 py-1">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-medium truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/5 flex items-center gap-2"
                  >
                    <LogOut className="size-4" />
                    {lang === 'RO' ? 'Deconectare' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
