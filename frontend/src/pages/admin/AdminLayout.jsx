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
  Inbox,
  Menu,
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
import employeeService from '../../services/employeeService';
import leaveService from '../../services/leaveService';
import { useT } from '../../i18n/useT';
import { getDepartmentLabel } from '../../utils/departmentLabel';

// ── Theme context ──────────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: false, toggleDark: () => {}, lang: 'RO', toggleLang: () => {} });
export const useTheme = () => useContext(ThemeCtx);

// ── Nav items (bilingual) ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'nav.overview',  to: '/admin',           icon: LayoutDashboard, end: true },
  { key: 'nav.employees', to: '/admin/employees', icon: Users },
  { key: 'nav.shifts',    to: '/admin/shifts',    icon: Calendar },
  { key: 'nav.leave',     to: '/admin/leave',     icon: FileText },
  { key: 'nav.bonuses',   to: '/admin/bonuses',   icon: Gift },
  { key: 'nav.demoRequests', to: '/admin/demo-requests', icon: Inbox },
  { key: 'nav.reports',   to: '/admin/reports',   icon: BarChart2 },
  { key: 'nav.settings',  to: '/admin/settings',  icon: Settings },
];

const formatName = (e) => `${e?.firstName || ''} ${e?.lastName || ''}`.trim() || e?.email || 'N/A';

const buildNotifications = (lang, t, employees = [], pendingLeaves = []) => {
  const leaveNotifs = pendingLeaves.slice(0, 2).map((leave, idx) => ({
    id: `leave-${leave.id}`,
    text: lang === 'RO'
      ? `${formatName(leave.employee)} a solicitat concediu`
      : `${formatName(leave.employee)} requested leave`,
      time: leave.createdAt ? new Date(leave.createdAt).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US') : '—',
    unread: idx === 0,
  }));

  const employeeNotifs = employees
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2)
    .map((emp, idx) => ({
      id: `emp-${emp.id}`,
      text: lang === 'RO'
        ? `Angajat: ${formatName(emp)} (${getDepartmentLabel(emp.department, t, { fallback: 'Fara departament' })})`
        : `Employee: ${formatName(emp)} (${getDepartmentLabel(emp.department, t, { fallback: 'No department' })})`,
      time: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US') : '—',
      unread: idx === 0,
    }));

  return [...leaveNotifs, ...employeeNotifs];
};

// ── Main Layout ────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [collapsed, setCollapsed]         = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]           = useState(() => window.innerWidth < 768);
  const [dark, setDark]                   = useState(() => localStorage.getItem('chain-theme') === 'dark');
  const [lang, setLang]                   = useState(() => localStorage.getItem('chain-lang') || 'RO');
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifSource, setNotifSource] = useState({ employees: [], pendingLeaves: [] });
  const t = useT(lang);
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

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [empRes, leaveRes] = await Promise.all([
          employeeService.getAll({ limit: 20 }),
          leaveService.getAll({ status: 'pending', limit: 20 }),
        ]);
        const employees = empRes.data?.data ?? empRes.data?.employees ?? [];
        const pendingLeaves = leaveRes.data?.data ?? leaveRes.data?.leaves ?? [];
        setNotifSource({ employees, pendingLeaves });
      } catch {
        setNotifSource({ employees: [], pendingLeaves: [] });
      }
    };
    loadNotifications();
  }, []);

  useEffect(() => {
    setNotifications(buildNotifications(lang, t, notifSource.employees, notifSource.pendingLeaves));
  }, [lang, t, notifSource]);

  const toggleDark = () => setDark((d) => {
    const next = !d;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('chain-theme', next ? 'dark' : 'light');
    return next;
  });

  const toggleLang = () => setLang((l) => {
    const next = l === 'EN' ? 'RO' : 'EN';
    localStorage.setItem('chain-lang', next);
    return next;
  });

  const navItems = NAV_ITEMS;
  const unreadCount = notifications.filter((n) => n.unread).length;
  const initials    = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <ThemeCtx.Provider value={{ dark, toggleDark, lang, toggleLang }}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 md:translate-x-0',
            isMobile
              ? `w-56 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : collapsed ? 'w-16' : 'w-56'
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
                  {t('layout.chainAdmin')}
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto hidden md:block p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors shrink-0"
              title={collapsed ? t('layout.expand') : t('layout.collapse')}
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
                onClick={() => setMobileSidebarOpen(false)}
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
                    {!collapsed && <span>{t(item.key)}</span>}
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
                    {user?.name || t('layout.admin')}
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
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 224) }}
        >
          {/* Top Nav */}
          <header className="flex items-center h-14 px-3 sm:px-4 border-b border-border bg-card shrink-0 gap-2 sm:gap-3">
            <button
              onClick={() => setMobileSidebarOpen((value) => !value)}
              className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
              title="Menu"
            >
              <Menu className="size-4" />
            </button>
            {/* Page title auto via breadcrumb - just show company */}
            <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Chain Technologies SRL</span>
            <div className="flex-1" />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
                className="relative p-2 rounded-md hover:bg-accent text-muted-foreground"
                title={t('layout.notifications')}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-[7px] bg-primary rounded-full" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-[calc(100vw-1.5rem)] max-w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">{t('layout.notifications')}</p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-primary font-medium">
                        {unreadCount} {t('layout.unread')}
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
                      {t('layout.markAllRead')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-md hover:bg-accent text-muted-foreground"
              title={dark ? t('layout.lightMode') : t('layout.darkMode')}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 p-2 rounded-md hover:bg-accent text-muted-foreground text-xs font-medium"
              title={lang === 'RO' ? t('layout.switchEN') : t('layout.switchRO')}
            >
              <Globe className="size-4" />
              <span className="hidden sm:inline">{lang}</span>
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
                    {t('layout.logout')}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
