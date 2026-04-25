import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  DollarSign,
  CalendarCheck,
  History,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  ClipboardList,
  BarChart2,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from './ThemeContext';
import { useT } from '../../../i18n/useT';

const NAV = [
  { to: '/dashboard',               icon: LayoutDashboard, key: 'sidebar.overview', end: true },
  { to: '/dashboard/time-tracking', icon: Clock,           key: 'sidebar.timeTracking' },
  { to: '/dashboard/schedule',      icon: CalendarDays,    key: 'sidebar.schedule' },
  { to: '/dashboard/salary',        icon: DollarSign,      key: 'sidebar.salary' },
  { to: '/dashboard/leave',         icon: CalendarCheck,   key: 'sidebar.leave' },
  { to: '/dashboard/history',       icon: History,         key: 'sidebar.history' },
  { to: '/dashboard/ai-assistant',  icon: Bot,             key: 'sidebar.aiAssistant' },
];

const ADMIN_NAV = [
  { to: '/admin',           icon: LayoutDashboard, key: 'sidebar.adminPanel' },
  { to: '/admin/employees', icon: Users,           key: 'sidebar.employees' },
  { to: '/admin/leave',     icon: ClipboardList,   key: 'nav.leave' },
  { to: '/admin/shifts',    icon: CalendarClock,   key: 'sidebar.shifts' },
  { to: '/admin/reports',   icon: BarChart2,       key: 'sidebar.reports' },
];

export function Sidebar({ collapsed, onToggle }) {
  const { isAdminOrManager } = useAuth();
  const { lang } = useTheme();
  const t = useT(lang);
  const navItems = NAV;
  const adminNavItems = ADMIN_NAV;

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-dash-sidebar border-r border-dash-border flex flex-col z-40 transition-all duration-300"
      style={{ width: collapsed ? '64px' : '240px' }}
    >
      {/* Logo + collapse button */}
      <div className="h-14 flex items-center border-b border-dash-border px-3 gap-2">
        {/* Logo — hidden when collapsed */}
        <a
          href="/"
          className="flex items-center gap-2 overflow-hidden flex-1 min-w-0"
          title={t('sidebar.goHome')}
        >
          <div className="w-7 h-7 rounded-md bg-dash-primary flex items-center justify-center shrink-0">
            <span className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>C</span>
          </div>
          {!collapsed && (
            <span className="text-dash-text tracking-tight truncate" style={{ fontSize: '18px', fontWeight: 700 }}>
              Chain
            </span>
          )}
        </a>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          title={collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-dash-text-muted hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 pt-1 pb-2 text-dash-text-muted uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: 600 }}>
            {t('sidebar.menu')}
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? t(item.key) : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-md transition-colors duration-150 ${
                collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-dash-primary-light text-dash-primary'
                  : 'text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-dash-primary" />
                )}
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                {!collapsed && (
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 500 : 400 }}>
                    {t(item.key)}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin section */}
      {isAdminOrManager && (
        <div className="py-3 px-2 border-t border-dash-border">
          {!collapsed && (
            <p className="px-3 pt-1 pb-2 text-dash-text-muted uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: 600 }}>
              {t('sidebar.admin')}
            </p>
          )}
          <div className="space-y-0.5">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? t(item.key) : undefined}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-md transition-colors duration-150 ${
                    collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-dash-primary-light text-dash-primary'
                      : 'text-dash-text-secondary hover:bg-dash-sidebar-hover hover:text-dash-text'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !collapsed && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-dash-primary" />
                    )}
                    <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    {!collapsed && (
                      <span style={{ fontSize: '13px', fontWeight: isActive ? 500 : 400 }}>
                        {t(item.key)}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-dash-border">
          <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>
            {t('sidebar.platform')}
          </p>
        </div>
      )}
    </aside>
  );
}
