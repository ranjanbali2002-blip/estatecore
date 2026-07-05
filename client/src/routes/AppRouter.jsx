import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PlanRoute from './PlanRoute';
import PageLoader from '../components/layout/PageLoader';

// Lazy-loaded pages — each becomes its own chunk, so heavy deps
// (recharts, @hello-pangea/dnd, papaparse) only load on the routes that use them.
const Landing = lazy(() => import('../pages/public/Landing'));
const Pricing = lazy(() => import('../pages/public/Pricing'));
const Login = lazy(() => import('../pages/public/Login'));
const ClientPortal = lazy(() => import('../pages/portal/ClientPortal'));

const ArchDashboard = lazy(() => import('../pages/architect/ArchDashboard'));
const ArchWorkspaces = lazy(() => import('../pages/architect/ArchWorkspaces'));
const ArchBilling = lazy(() => import('../pages/architect/ArchBilling'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AgentDashboard = lazy(() => import('../pages/agent/AgentDashboard'));
const BrandSettings = lazy(() => import('../pages/admin/BrandSettings'));
const AgentManagement = lazy(() => import('../pages/admin/AgentManagement'));
const AdminBilling = lazy(() => import('../pages/admin/AdminBilling'));
const Integrations = lazy(() => import('../pages/admin/Integrations'));
const MetaCallback = lazy(() => import('../pages/admin/MetaCallback'));

const Leads = lazy(() => import('../pages/shared/Leads'));
const Deals = lazy(() => import('../pages/shared/Deals'));
const Properties = lazy(() => import('../pages/shared/Properties'));
const Tasks = lazy(() => import('../pages/shared/Tasks'));
const Analytics = lazy(() => import('../pages/shared/Analytics'));
const Leaderboard = lazy(() => import('../pages/shared/Leaderboard'));

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'agent') return <AgentDashboard />;
  return <AdminDashboard />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'architect') return <Navigate to="/architect/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/home" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />

        {/* Architect */}
        <Route
          path="/architect/dashboard"
          element={<ProtectedRoute><RoleRoute roles="architect"><ArchDashboard /></RoleRoute></ProtectedRoute>}
        />
        <Route
          path="/architect/workspaces"
          element={<ProtectedRoute><RoleRoute roles="architect"><ArchWorkspaces /></RoleRoute></ProtectedRoute>}
        />
        <Route
          path="/architect/billing"
          element={<ProtectedRoute><RoleRoute roles="architect"><ArchBilling /></RoleRoute></ProtectedRoute>}
        />

        {/* Admin + Agent shared */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRoute roles={['admin', 'agent']}><DashboardRouter /></RoleRoute></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><RoleRoute roles={['admin', 'agent']}><Leads /></RoleRoute></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><RoleRoute roles={['admin', 'agent']}><Deals /></RoleRoute></ProtectedRoute>} />
        <Route path="/properties" element={<ProtectedRoute><RoleRoute roles={['admin', 'agent']}><Properties /></RoleRoute></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><RoleRoute roles={['admin', 'agent']}><Tasks /></RoleRoute></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/analytics" element={<ProtectedRoute><RoleRoute roles="admin"><Analytics /></RoleRoute></ProtectedRoute>} />
        <Route
          path="/leaderboard"
          element={<ProtectedRoute><RoleRoute roles="admin"><PlanRoute feature="leaderboard" title="Leaderboard"><Leaderboard /></PlanRoute></RoleRoute></ProtectedRoute>}
        />
        <Route path="/agents" element={<ProtectedRoute><RoleRoute roles="admin"><AgentManagement /></RoleRoute></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><RoleRoute roles="admin"><Integrations /></RoleRoute></ProtectedRoute>} />
        <Route path="/integrations/meta/callback" element={<ProtectedRoute><RoleRoute roles="admin"><MetaCallback /></RoleRoute></ProtectedRoute>} />
        <Route path="/brand-settings" element={<ProtectedRoute><RoleRoute roles="admin"><BrandSettings /></RoleRoute></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><RoleRoute roles="admin"><AdminBilling /></RoleRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
