import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/common/Spinner';

// ── Lazy pages ───────────────────────────────────────────────────────────────
const LandingPage     = lazy(() => import('./pages/Landing/LandingPage'));

const DashboardLayout  = lazy(() => import('./pages/Dashboard/employee/DashboardLayout'));
const OverviewPage     = lazy(() => import('./pages/Dashboard/employee/pages/OverviewPage'));
const TimeTrackingPage = lazy(() => import('./pages/Dashboard/employee/pages/TimeTrackingPage'));
const SchedulePage     = lazy(() => import('./pages/Dashboard/employee/pages/SchedulePage'));
const EmpSalaryPage    = lazy(() => import('./pages/Dashboard/employee/pages/SalaryPage'));
const EmpLeavePage     = lazy(() => import('./pages/Dashboard/employee/pages/LeavePage'));
const HistoryPage      = lazy(() => import('./pages/Dashboard/employee/pages/HistoryPage'));
const AIAssistantPage  = lazy(() => import('./pages/Dashboard/employee/pages/AIAssistantPage'));
const EmpProfilePage   = lazy(() => import('./pages/Dashboard/employee/pages/ProfilePage'));

const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview  = lazy(() => import('./pages/admin/AdminOverview'));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminShifts    = lazy(() => import('./pages/admin/AdminShifts'));
const AdminLeave     = lazy(() => import('./pages/admin/AdminLeave'));
const AdminBonuses   = lazy(() => import('./pages/admin/AdminBonuses'));
const AdminReports   = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings  = lazy(() => import('./pages/admin/AdminSettings'));

// ── Route guards ─────────────────────────────────────────────────────────────

/**
 * HomeRoute: shown at "/".
 * - Loading → spinner
 * - Authenticated admin/manager → /admin
 * - Authenticated employee → /dashboard
 * - Not authenticated → Landing page
 */
const HomeRoute = () => {
  const { isAuthenticated, isAdminOrManager, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  if (isAuthenticated) {
    return <Navigate to={isAdminOrManager ? '/admin' : '/dashboard'} replace />;
  }
  return <LandingPage />;
};

/** Requires authentication; unauthenticated → landing. */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

/** Requires admin/manager role; employees → /dashboard. */
const AdminRoute = ({ children }) => {
  const { isAdminOrManager, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  return isAdminOrManager ? children : <Navigate to="/dashboard" replace />;
};

/** Prevents admins from using employee routes → /admin. */
const EmployeeRoute = ({ children }) => {
  const { isAdminOrManager, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  return isAdminOrManager ? <Navigate to="/admin" replace /> : children;
};

// ── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<Spinner fullscreen />}>
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      {/* Employee dashboard */}
      <Route element={<PrivateRoute><EmployeeRoute><DashboardLayout /></EmployeeRoute></PrivateRoute>}>
        <Route path="dashboard"               element={<OverviewPage />} />
        <Route path="dashboard/time-tracking" element={<TimeTrackingPage />} />
        <Route path="dashboard/schedule"      element={<SchedulePage />} />
        <Route path="dashboard/salary"        element={<EmpSalaryPage />} />
        <Route path="dashboard/leave"         element={<EmpLeavePage />} />
        <Route path="dashboard/history"       element={<HistoryPage />} />
        <Route path="dashboard/ai-assistant"  element={<AIAssistantPage />} />
        <Route path="dashboard/profile"       element={<EmpProfilePage />} />
      </Route>

      {/* Admin dashboard */}
      <Route element={<PrivateRoute><AdminRoute><AdminLayout /></AdminRoute></PrivateRoute>}>
        <Route path="admin"           element={<AdminOverview />} />
        <Route path="admin/employees" element={<AdminEmployees />} />
        <Route path="admin/shifts"    element={<AdminShifts />} />
        <Route path="admin/leave"     element={<AdminLeave />} />
        <Route path="admin/bonuses"   element={<AdminBonuses />} />
        <Route path="admin/reports"   element={<AdminReports />} />
        <Route path="admin/settings"  element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

