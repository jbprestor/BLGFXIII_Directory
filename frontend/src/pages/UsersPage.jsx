import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../services/axios.js";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { user } = useAuth();
  const { getPendingUsers, getAllUsers, updateUserStatus } = useApi();
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState({});

  // Check if current user is admin
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        getPendingUsers(),
        getAllUsers()
      ]);
      
      // Backend returns { success: true, data: [...] }
      // Axios wraps it in response.data, so we need response.data.data
      setPendingUsers(pendingResponse.data?.data || []);
      setAllUsers(allResponse.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch users: " + error.message);
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      await updateUserStatus(userId, action);
      
      const actionText = action === "approved" ? "approved" : "rejected";
      toast.success(`User ${actionText} successfully!`);
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user: ` + error.message);
      console.error(`Error ${action} user:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "badge-warning",
      approved: "badge-success", 
      rejected: "badge-error"
    };
    
    return (
      <span className={`badge badge-sm ${statusColors[status] || "badge-neutral"}`}>
        {status || "unknown"}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      Admin: "badge-error",
      Regional: "badge-primary",
      Provincial: "badge-secondary",
      Municipal: "badge-accent"
    };
    
    return (
      <span className={`badge badge-sm ${roleColors[role] || "badge-neutral"}`}>
        {role}
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-base-content mb-2">Access Denied</h1>
          <p className="text-base-content/60">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/60 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">User Management</h1>
              <p className="text-base-content/60">Manage user accounts and approvals</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stats shadow bg-base-100">
              <div className="stat">
                <div className="stat-figure text-warning">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-title">Pending Approval</div>
                <div className="stat-value text-warning">{pendingUsers.length}</div>
                <div className="stat-desc">Awaiting review</div>
              </div>
            </div>
            
            <div className="stats shadow bg-base-100">
              <div className="stat">
                <div className="stat-figure text-success">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-title">Approved Users</div>
                <div className="stat-value text-success">
                  {allUsers.filter(u => u.status === "approved").length}
                </div>
                <div className="stat-desc">Active accounts</div>
              </div>
            </div>
            
            <div className="stats shadow bg-base-100">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="stat-title">Total Users</div>
                <div className="stat-value text-primary">{allUsers.length}</div>
                <div className="stat-desc">All accounts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm mb-6">
          <button 
            className={`tab ${activeTab === "pending" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <span className="mr-2">⏳</span>
            Pending Approval ({pendingUsers.length})
          </button>
          <button 
            className={`tab ${activeTab === "all" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span className="mr-2">👥</span>
            All Users ({allUsers.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {activeTab === "pending" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>⏳</span>
                Pending User Approvals
              </h2>
              
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-base-content mb-2">No Pending Approvals</h3>
                  <p className="text-base-content/60">All user registrations have been reviewed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Region</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="font-semibold">{user.firstName} {user.lastName}</div>
                          </td>
                          <td>
                            <div className="text-sm">{user.email}</div>
                          </td>
                          <td>{getRoleBadge(user.role)}</td>
                          <td>
                            <div className="text-sm">{user.region || "N/A"}</div>
                          </td>
                          <td>
                            <div className="text-sm">{formatDate(user.createdAt)}</div>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleUserAction(user._id, "approved")}
                                disabled={actionLoading[user._id]}
                              >
                                {actionLoading[user._id] ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "✓ Approve"
                                )}
                              </button>
                              <button
                                className="btn btn-error btn-sm"
                                onClick={() => handleUserAction(user._id, "rejected")}
                                disabled={actionLoading[user._id]}
                              >
                                {actionLoading[user._id] ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  "✗ Reject"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "all" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>👥</span>
                All Users
              </h2>
              
              {allUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-base-content mb-2">No Users Found</h3>
                  <p className="text-base-content/60">No users have been registered yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Region</th>
                        <th>Status</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="font-semibold">{user.firstName} {user.lastName}</div>
                          </td>
                          <td>
                            <div className="text-sm">{user.email}</div>
                          </td>
                          <td>{getRoleBadge(user.role)}</td>
                          <td>
                            <div className="text-sm">{user.region || "N/A"}</div>
                          </td>
                          <td>{getStatusBadge(user.status)}</td>
                          <td>
                            <div className="text-sm">{formatDate(user.createdAt)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}