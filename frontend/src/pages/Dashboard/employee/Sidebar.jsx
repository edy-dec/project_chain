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

const NAV = {
  RO: [
    { to: '/dashboard',              icon: LayoutDashboard, label: 'Prezentare',   end: true },
    { to: '/dashboard/time-tracking',icon: Clock,           label: 'Pontaj'               },
    { to: '/dashboard/schedule',     icon: CalendarDays,    label: 'Program'              },
    { to: '/dashboard/salary',       icon: DollarSign,      label: 'Salariu'              },
    { to: '/dashboard/leave',        icon: CalendarCheck,   label: 'Concediu'             },
    { to: '/dashboard/history',      icon: History,         label: 'Istoric'              },
    { to: '/dashboard/ai-assistant', icon: Bot,             label: 'Asistent AI'          },
  ],
  EN: [
    { to: '/dashboard',              icon: LayoutDashboard, label: 'Overview',     end: true },
    { to: '/dashboard/time-tracking',icon: Clock,           label: 'Time Tracking'        },
    { to: '/dashboard/schedule',     icon: CalendarDays,    label: 'Schedule'             },
    { to: '/dashboard/salary',       icon: DollarSign,      label: 'Salary'               },
    { to: '/dashboard/leave',        icon: CalendarCheck,   label: 'Leave'                },
    { to: '/dashboard/history',      icon: History,         label: 'History'              },
    { to: '/dashboard/ai-assistant', icon: Bot,             label: 'AI Assistant'         },
  ],
};

const ADMIN_NAV = {
  RO: [
    { to: '/admin',           icon: LayoutDashboard, label: 'Admin Panel' },
    { to: '/admin/employees', icon: Users,           label: 'Angajați'   },
    { to: '/admin/leave',     icon: ClipboardList,   label: 'Concedii'   },
    { to: '/admin/shifts',    icon: CalendarClock,   label: 'Schimburi'  },
    { to: '/admin/reports',   icon: BarChart2,       label: 'Rapoarte'   },
  ],
  EN: [
    { to: '/admin',           icon: LayoutDashboard, label: 'Admin Panel' },
    { to: '/admin/employees', icon: Users,           label: 'Employees'  },
    { to: '/admin/leave',     icon: ClipboardList,   label: 'Leave'      },
    { to: '/admin/shifts',    icon: CalendarClock,   label: 'Shifts'     },
    { to: '/admin/reports',   icon: BarChart2,       label: 'Reports'    },
  ],
};

export function Sidebar({ collapsed, onToggle }) {
  const { isAdminOrManager } = useAuth();
  const { lang } = useTheme();
  const navItems      = NAV[lang]       || NAV.RO;
  const adminNavItems = ADMIN_NAV[lang] || ADMIN_NAV.RO;

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
          title="Go to home"
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
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-dash-text-muted hover:bg-dash-sidebar-hover hover:text-dash-text transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 pt-1 pb-2 text-dash-text-muted uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: 600 }}>
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
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
                    {item.label}
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
              Admin
            </p>
          )}
          <div className="space-y-0.5">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
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
                        {item.label}
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
            Chain HR Platform v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
