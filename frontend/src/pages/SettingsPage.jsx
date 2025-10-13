import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router";

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Settings</h1>
              <p className="text-base-content/60">System Configuration</p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">👤</span>
                <h2 className="card-title">Profile</h2>
              </div>
              <p className="text-base-content/70 mb-4">Manage your personal information and account settings.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">
                  Manage Profile
                </button>
              </div>
            </div>
          </div>

          {/* User Management - Admin Only */}
          {user?.role === "Admin" && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👥</span>
                  <h2 className="card-title">User Management</h2>
                </div>
                <p className="text-base-content/70 mb-4">Manage user accounts, approvals, and permissions.</p>
                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/users')}
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔧</span>
                <h2 className="card-title">Preferences</h2>
              </div>
              <p className="text-base-content/70 mb-4">Customize your application preferences and defaults.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">
                  Edit Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔒</span>
                <h2 className="card-title">Security</h2>
              </div>
              <p className="text-base-content/70 mb-4">Manage your password, two-factor authentication, and security settings.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">
                  Security Settings
                </button>
              </div>
            </div>
          </div>

          {/* Create User - Admin Only */}
          {user?.role === "Admin" && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">➕</span>
                  <h2 className="card-title">Create User</h2>
                </div>
                <p className="text-base-content/70 mb-4">Add new users to the system with appropriate roles and permissions.</p>
                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/create')}
                  >
                    Create User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="mt-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Current User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    className="input input-bordered w-full" 
                    disabled 
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Email</span>
                  </label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    className="input input-bordered w-full" 
                    disabled 
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Role</span>
                  </label>
                  <input 
                    type="text" 
                    value={user?.role || ''}
                    className="input input-bordered w-full" 
                    disabled 
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Region</span>
                  </label>
                  <input 
                    type="text" 
                    value={user?.region || 'N/A'}
                    className="input input-bordered w-full" 
                    disabled 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}