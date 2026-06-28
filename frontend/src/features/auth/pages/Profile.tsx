import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../../../components/Card/Card';
import { Shield, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router';

const ProfileComponent: React.FC = () => {
  const { user } = useAuth();

  const formattedDate = useMemo(() => {
    if (!user?.createdAt) return 'N/A';
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [user?.createdAt]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Card title="User Account Profile" subtitle="Your core VMS profile credentials and status">
        <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
          <div className="h-16 w-16 rounded-full bg-primary-light border border-emerald-100 flex items-center justify-center">
            {user.role === 'ADMIN' ? (
              <Shield className="h-8 w-8 text-primary" />
            ) : (
              <UserIcon className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{user.email}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {user.role}
              </span>
              {user.vendorProfile && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.vendorProfile.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : user.vendorProfile.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.vendorProfile.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4.5 w-4.5 text-slate-400" />
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Email Address</span>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4.5 w-4.5 text-slate-400" />
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Created At</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </Card>

      {user.role === 'VENDOR' && user.vendorProfile && (
        <Card
          title="Vendor Business Profile"
          subtitle="Details registered during company onboarding"
          headerAction={
            <Link
              to="/vendor/profile-completion"
              className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              Edit Profile
            </Link>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-600">
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Vendor Type</span>
              <span>{user.vendorProfile.vendorType}</span>
            </div>
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Vendor Role</span>
              <span>{user.vendorProfile.businessCategory || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Owner Name</span>
              <span>{user.vendorProfile.ownerName || 'N/A'}</span>
            </div>
            {user.vendorProfile.vendorType === 'COMPANY' && (
              <>
                <div>
                  <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Company Name</span>
                  <span>{user.vendorProfile.companyName || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Trade License #</span>
                  <span>{user.vendorProfile.tradeLicenseNo || 'N/A'}</span>
                </div>
              </>
            )}
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Phone</span>
              <span>{user.vendorProfile.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Website</span>
              <span>{user.vendorProfile.website || 'N/A'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400">Registered Address</span>
              <span>
                {user.vendorProfile.address
                  ? `${user.vendorProfile.address}, ${user.vendorProfile.city}, ${user.vendorProfile.country}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export const Profile = React.memo(ProfileComponent);
Profile.displayName = 'Profile';
export default Profile;
