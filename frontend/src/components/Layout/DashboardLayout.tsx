import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { notificationApi } from '../../api/notificationApi';
import { vendorApi } from '../../api/vendorApi';
import { toastService } from '../../lib/notifications/toastService';
import { toast } from 'react-hot-toast';
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
  Bell,
  Trash2,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayoutComponent: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'VENDOR';
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | null>(null);

  // Vendor profile query (live polling status)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: vendorApi.getProfile,
    enabled: role === 'VENDOR',
    refetchInterval: 5000, // Auto-sync approval state in real-time
  });

  const isPendingApproval = useMemo(() => {
    if (role !== 'VENDOR') return false;
    if (isLoadingProfile) return false; // Prevent flickering during initial query fetch
    const currentStatus = profile ? profile.status : user?.vendorProfile?.status;
    return currentStatus === 'PENDING';
  }, [role, profile, user, isLoadingProfile]);

  useEffect(() => {
    if (isPendingApproval) {
      if (!toastIdRef.current) {
        toastIdRef.current = toastService.warn(
          'Your account is pending administrator approval. Portal is in read-only mode.',
          Infinity
        ) as any;
      }
    } else {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [isPendingApproval]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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



  // Stats query for admin approvals badge count
  const { data: adminStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminApi.getDashboard,
    enabled: role === 'ADMIN',
    refetchInterval: 5000, // Live updates every 5 seconds
  });

  // Notifications query
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getNotifications,
    refetchInterval: 5000, // Live notification updates
  });

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationApi.clearAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

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
          label: 'Pending Approvals',
          path: '/admin/approvals',
          icon: <ShieldCheck className="h-5 w-5 shrink-0 text-amber-550" />,
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
      const isSubmitted = profile ? profile.isSubmitted : user?.vendorProfile?.isSubmitted;
      return [
        {
          label: 'Dashboard',
          path: '/vendor/dashboard',
          icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
        },
        {
          label: isSubmitted ? 'View Profile' : 'Complete Profile',
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
  }, [role, user, profile]);

  const renderSidebarItem = useCallback(
    (item: SidebarItem) => {
      const isActive = location.pathname === item.path;
      const showBadge = item.label === 'Pending Approvals' && adminStats?.pendingVendors && adminStats.pendingVendors > 0;
      const isItemDisabled = isPendingApproval && item.path !== '/vendor/dashboard';
      return (
        <Link
          key={item.path}
          to={isItemDisabled ? '#' : item.path}
          onClick={(e) => {
            if (isItemDisabled) {
              e.preventDefault();
              return;
            }
            closeMobile();
          }}
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 select-none relative ${
            isActive
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          } ${isItemDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {item.icon}
          {!isCollapsed && <span className="truncate">{item.label}</span>}
          {!isCollapsed && showBadge && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {adminStats.pendingVendors}
            </span>
          )}
          {isCollapsed && showBadge && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </Link>
      );
    },
    [location.pathname, isCollapsed, closeMobile, adminStats, isPendingApproval]
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
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-55/60 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markReadMutation.mutate()}
                          className="text-[10px] font-bold text-primary hover:text-primary-focus transition-colors cursor-pointer flex items-center gap-0.5"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={() => clearAllMutation.mutate()}
                          className="text-[10px] font-bold text-red-650 hover:text-red-850 transition-colors cursor-pointer flex items-center gap-0.5"
                          title="Clear all notifications"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                        <Bell className="h-6 w-6 text-slate-300 stroke-1" />
                        <p className="text-xxs text-slate-400 font-medium">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-slate-50/50 transition-colors flex items-start gap-2.5 relative ${
                            !notif.read ? 'bg-primary/[0.02]' : ''
                          }`}
                        >
                          {!notif.read && (
                            <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                          <div className="flex-1 min-w-0 pl-1.5">
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-xxs text-slate-550 mt-0.5 leading-relaxed font-medium break-words">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-400 font-medium mt-1 inline-block">
                              {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
