import React, { useState, useCallback, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  ListPlus,
  Users,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
  Shield,
  FileText,
  FolderOpen,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayoutComponent: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const role = user?.role || 'VENDOR';

  // Memoize sidebar items depending on role
  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (role === 'ADMIN') {
      return [
        {
          label: 'Dashboard',
          path: '/admin/dashboard',
          icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'Vendors Database',
          path: '/admin/vendors',
          icon: <Building2 className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'Service Tree',
          path: '/admin/services',
          icon: <ListPlus className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'System Users',
          path: '/admin/users',
          icon: <Users className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'Vendor Documents',
          path: '/admin/documents',
          icon: <FolderOpen className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'Activity Logs',
          path: '/admin/activity-logs',
          icon: <History className="h-5 w-5 shrink-0" />,
        },
      ];
    } else {
      return [
        {
          label: 'Dashboard',
          path: '/vendor/dashboard',
          icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'Complete Profile',
          path: '/vendor/profile-completion',
          icon: <UserIcon className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'My Services',
          path: '/vendor/services',
          icon: <ListPlus className="h-5 w-5 shrink-0" />,
        },
        {
          label: 'My Documents',
          path: '/vendor/documents',
          icon: <FileText className="h-5 w-5 shrink-0" />,
        },
      ];
    }
  }, [role]);

  const renderSidebarItem = useCallback(
    (item: SidebarItem) => {
      const isActive = location.pathname === item.path;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={closeMobile}
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 select-none ${
            isActive
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {item.icon}
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </Link>
      );
    },
    [location.pathname, isCollapsed, closeMobile]
  );

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden select-none">
      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-100 bg-white transition-all duration-300 relative shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Branding header */}
        <div className="h-16 px-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-slate-800 tracking-tight text-sm whitespace-nowrap">
                Construction VMS
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-5 flex flex-col gap-1.5 overflow-y-auto">
          {sidebarItems.map(renderSidebarItem)}
        </nav>

        {/* User context footer */}
        <div className="p-4 border-t border-slate-50 flex flex-col gap-3.5 bg-slate-50/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              {role === 'ADMIN' ? (
                <Shield className="h-4 w-4 text-slate-600" />
              ) : (
                <UserIcon className="h-4 w-4 text-slate-600" />
              )}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.email}
                </p>
                <p className="text-xxs text-slate-400 capitalize">{role.toLowerCase()}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all select-none w-full border border-transparent hover:border-red-100 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>

        {/* Sidebar Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3.5 top-20 h-7 w-7 rounded-full border border-slate-100 bg-white shadow-xs flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors hidden md:flex cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-sm">
              Construction VMS
            </span>
          </div>
          <button onClick={toggleMobile} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-5 flex flex-col gap-1.5 overflow-y-auto">
          {sidebarItems.map(renderSidebarItem)}
        </nav>
        <div className="p-4 border-t border-slate-50 flex flex-col gap-3.5 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              {role === 'ADMIN' ? (
                <Shield className="h-4 w-4 text-slate-600" />
              ) : (
                <UserIcon className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
              <p className="text-xxs text-slate-400 capitalize">{role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all select-none w-full border border-transparent hover:border-red-100"
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          <button
            onClick={toggleMobile}
            className="text-slate-500 hover:text-slate-700 md:hidden focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Real Estate Construction System
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user?.email}</p>
              <p className="text-xxs text-slate-400 capitalize font-medium">
                {role.toLowerCase()} Account
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary text-sm border border-slate-200">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = React.memo(DashboardLayoutComponent);
DashboardLayout.displayName = 'DashboardLayout';
export default DashboardLayout;
