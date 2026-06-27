import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router';
import { Loader } from '../components/Loader/Loader';
import ProtectedRoute from './ProtectedRoute';

// Layouts
const AuthLayout = lazy(() => import('../components/Layout/AuthLayout'));
const DashboardLayout = lazy(() => import('../components/Layout/DashboardLayout'));

// Public pages
const Landing = lazy(() => import('../features/auth/pages/Landing'));
const Login = lazy(() => import('../features/auth/pages/Login'));
const Signup = lazy(() => import('../features/auth/pages/Signup'));
const ForgotPassword = lazy(() => import('../features/auth/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../features/auth/pages/ResetPassword'));

// Protected Pages (Shared)
const Profile = lazy(() => import('../features/auth/pages/Profile'));
const ChangePassword = lazy(() => import('../features/auth/pages/ChangePassword'));
const Unauthorized = lazy(() => import('../features/auth/pages/Unauthorized'));
const NotFound = lazy(() => import('../features/auth/pages/NotFound'));

// Protected Pages (Vendor)
const VendorDashboard = lazy(() => import('../features/vendor/pages/VendorDashboard'));
const ProfileCompletion = lazy(() => import('../features/vendor/pages/ProfileCompletion'));
const MyServices = lazy(() => import('../features/vendor/pages/MyServices'));

// Protected Pages (Admin)
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard'));
const VendorList = lazy(() => import('../features/admin/pages/VendorList'));
const VendorDetails = lazy(() => import('../features/admin/pages/VendorDetails'));
const ManageServices = lazy(() => import('../features/admin/pages/ManageServices'));
const ManageUsers = lazy(() => import('../features/admin/pages/ManageUsers'));
const ActivityLogs = lazy(() => import('../features/admin/pages/ActivityLogs'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Routes>
        {/* Root Landing Route */}
        <Route path="/" element={<Landing />} />

        {/* Public Guest Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Shared Routes (Inside Dashboard layout) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* Protected Vendor Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['VENDOR']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/profile-completion" element={<ProfileCompletion />} />
          <Route path="/vendor/services" element={<MyServices />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/vendors" element={<VendorList />} />
          <Route path="/admin/vendors/:id" element={<VendorDetails />} />
          <Route path="/admin/services" element={<ManageServices />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/activity-logs" element={<ActivityLogs />} />
        </Route>

        {/* Fallback 404 Route */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
