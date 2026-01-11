import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useApi from "../services/axios.js";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const api = useApi();
  const fileInputRef = useRef(null);

  // Get proper image URL based on environment
  const getImageUrl = (path) => {
    if (!path) {
      console.log("getImageUrl called with null/undefined path");
      return null;
    }
    const baseUrl = import.meta.env.VITE_IMG_URL ||
      (import.meta.env.MODE === "development"
        ? "http://localhost:5001"
        : "");
    const fullUrl = `${baseUrl}${path}`;
    console.log("✅ getImageUrl - Path:", path, "| Base URL:", baseUrl, "| Full URL:", fullUrl);
    return fullUrl;
  };

  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);

  console.log("ProfilePage - user.profilePicture:", user?.profilePicture);
  console.log("ProfilePage - profilePicture state:", profilePicture);

  // Form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    region: user?.region || "",
    contactNumber: "",
    officeLocation: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await api.updateProfile(formData);
      if (response.data.success) {
        toast.success("Profile updated successfully!");
        // Update user in auth context
        if (updateUser) {
          updateUser(response.data.data);
        }
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      console.log("Uploading file:", file.name, file.type, file.size);
      const response = await api.uploadProfilePicture(formData);
      console.log("Upload response:", response.data);

      if (response.data.success) {
        const newPicturePath = response.data.data.profilePicture;
        console.log("New picture path:", newPicturePath);
        setProfilePicture(newPicturePath);
        toast.success("Profile picture updated successfully!");

        // Update user in auth context
        if (updateUser) {
          updateUser({ ...user, profilePicture: newPicturePath });
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profilePicture) return;

    try {
      const response = await api.deleteProfilePicture();
      if (response.data.success) {
        setProfilePicture(null);
        toast.success("Profile picture removed successfully!");

        // Update user in auth context
        if (updateUser) {
          updateUser({ ...user, profilePicture: null });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove profile picture");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      // API call to change password would go here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      Admin: "badge-error",
      Regional: "badge-primary",
      Provincial: "badge-secondary",
      Municipal: "badge-accent",
    };
    return `badge ${roleColors[role] || "badge-neutral"}`;
  };

  return (
    <div className="min-h-screen bg-base-200/30 p-2 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Profile Card */}
        <div className="card bg-gradient-to-r from-primary to-primary-focus text-primary-content shadow-xl mb-4">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar with Upload */}
              <div className="relative group w-20 h-20 sm:w-24 sm:h-24">
                <div className="avatar w-full h-full">
                  <div className={`w-full h-full rounded-full ring ring-offset-base-100 ring-offset-2 bg-base-100 flex items-center justify-center overflow-hidden relative ${isEditing ? 'ring-primary cursor-pointer' : 'ring-primary-content'}`}>
                    {profilePicture && getImageUrl(profilePicture) ? (
                      <>
                        <img
                          key={profilePicture}
                          src={getImageUrl(profilePicture)}
                          alt="Profile"
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => {
                            console.error("Image failed to load. URL:", e.target.src);
                            console.error("Profile picture path:", profilePicture);
                            setProfilePicture(null);
                            toast.error("Failed to load profile picture");
                          }}
                          onLoad={() => {
                            console.log("Image loaded successfully!");
                          }}
                        />
                        <span className="text-2xl sm:text-3xl font-bold text-primary absolute inset-0 flex items-center justify-center bg-base-100 -z-10">
                          {getInitials()}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-primary">
                        {getInitials()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload overlay - only show in edit mode */}
                {isEditing && (
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-20 pointer-events-none">
                    <div className="flex gap-2 pointer-events-auto">
                      <button
                        onClick={handleProfilePictureClick}
                        className="btn btn-circle btn-sm bg-white hover:bg-base-200 border-none shadow-lg hover:scale-110 transition-transform"
                        disabled={isUploadingPicture}
                        title="Upload picture"
                      >
                        {isUploadingPicture ? (
                          <span className="loading loading-spinner loading-xs text-primary"></span>
                        ) : (
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      {profilePicture && (
                        <button
                          onClick={handleDeleteProfilePicture}
                          className="btn btn-circle btn-sm bg-error hover:bg-error-focus text-white border-none shadow-lg hover:scale-110 transition-transform"
                          title="Remove picture"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit indicator badge - show when in edit mode */}
                {isEditing && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg animate-pulse z-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <span className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-lg">
                  {user?.firstName} {user?.middleName} {user?.lastName}
                </span>
                <p className="text-primary/90 text-sm sm:text-base drop-shadow">
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                  <span className={`${getRoleBadge(user?.role)} badge-sm sm:badge-md`}>
                    {user?.role}
                  </span>
                  {user?.region && (
                    <span className="badge badge-outline badge-sm sm:badge-md text-primary-content border-primary-content/80">
                      📍 {user.region}
                    </span>
                  )}
                  <span className="badge badge-success badge-sm sm:badge-md">
                    ✓ Active
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-sm sm:btn-md bg-white text-primary hover:bg-base-200"
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Edit mode hint */}
            {isEditing && (
              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">Hover over your profile picture to upload or change it</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 shadow-sm mb-4 p-1">
          <button
            className={`tab tab-sm sm:tab-md ${activeTab === "personal" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            👤 Personal Info
          </button>
          <button
            className={`tab tab-sm sm:tab-md ${activeTab === "security" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔒 Security
          </button>
          <button
            className={`tab tab-sm sm:tab-md ${activeTab === "activity" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            📊 Activity
          </button>
          <button
            className={`tab tab-sm sm:tab-md ${activeTab === "preferences" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            ⚙️ Preferences
          </button>
        </div>

        {/* Tab Content */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Personal Information</h2>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            firstName: user?.firstName || "",
                            lastName: user?.lastName || "",
                            email: user?.email || "",
                            region: user?.region || "",
                            contactNumber: "",
                            officeLocation: "",
                          });
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary btn-sm"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">First Name</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Last Name</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Email Address</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Contact Number</span>
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      placeholder="+63 XXX XXX XXXX"
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Region */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Region</span>
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Office Location */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Office Location</span>
                    </label>
                    <input
                      type="text"
                      name="officeLocation"
                      value={formData.officeLocation}
                      onChange={handleInputChange}
                      placeholder="Building, Floor, Room"
                      className="input input-bordered w-full"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Account Details */}
                <div className="divider">Account Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Account Role</div>
                    <div className="stat-value text-lg">{user?.role}</div>
                    <div className="stat-desc">Your access level</div>
                  </div>
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Account Status</div>
                    <div className="stat-value text-lg text-success">Active</div>
                    <div className="stat-desc">Account is verified</div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Security Settings</h2>

                {/* Change Password Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Change Password</h3>
                    <p className="text-sm text-base-content/70 mb-4">
                      Update your password regularly to keep your account secure
                    </p>

                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Current Password</span>
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="input input-bordered w-full"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">New Password</span>
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="input input-bordered w-full"
                          placeholder="Enter new password"
                        />
                        <label className="label">
                          <span className="label-text-alt">
                            Must be at least 8 characters
                          </span>
                        </label>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">
                            Confirm New Password
                          </span>
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="input input-bordered w-full"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        className="btn btn-primary"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Changing...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Two-Factor Authentication</h3>
                    <p className="text-sm text-base-content/70 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Status</p>
                        <p className="text-sm text-base-content/70">Not enabled</p>
                      </div>
                      <button className="btn btn-outline btn-sm">Enable 2FA</button>
                    </div>
                  </div>
                </div>

                {/* Session Management */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Active Sessions</h3>
                    <p className="text-sm text-base-content/70 mb-4">
                      Manage your active login sessions
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">💻</span>
                          </div>
                          <div>
                            <p className="font-semibold text-base-content">Current Session</p>
                            <p className="text-xs text-base-content/70 font-medium">
                              Windows • Chrome • Just now
                            </p>
                          </div>
                        </div>
                        <span className="badge badge-success badge-sm">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

                {/* Activity Timeline */}
                <div className="space-y-3">
                  {[
                    {
                      icon: "✏️",
                      title: "Profile updated",
                      time: "2 hours ago",
                      color: "primary",
                    },
                    {
                      icon: "🔐",
                      title: "Password changed",
                      time: "1 day ago",
                      color: "success",
                    },
                    {
                      icon: "📝",
                      title: "Logged in",
                      time: "3 days ago",
                      color: "info",
                    },
                    {
                      icon: "📤",
                      title: "Data exported",
                      time: "5 days ago",
                      color: "warning",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 bg-${activity.color}/20 rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-2xl">{activity.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-base-content">{activity.title}</p>
                        <p className="text-sm text-base-content/70 font-medium">{activity.time}</p>
                      </div>
                      <button className="btn btn-ghost btn-sm">Details</button>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="divider">Statistics</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="stat bg-base-200 rounded-box place-items-center p-3">
                    <div className="stat-title text-xs">Logins</div>
                    <div className="stat-value text-2xl text-primary">24</div>
                    <div className="stat-desc text-xs">This month</div>
                  </div>
                  <div className="stat bg-base-200 rounded-box place-items-center p-3">
                    <div className="stat-title text-xs">Exports</div>
                    <div className="stat-value text-2xl text-success">12</div>
                    <div className="stat-desc text-xs">This month</div>
                  </div>
                  <div className="stat bg-base-200 rounded-box place-items-center p-3">
                    <div className="stat-title text-xs">Updates</div>
                    <div className="stat-value text-2xl text-warning">8</div>
                    <div className="stat-desc text-xs">This month</div>
                  </div>
                  <div className="stat bg-base-200 rounded-box place-items-center p-3">
                    <div className="stat-title text-xs">Views</div>
                    <div className="stat-value text-2xl text-info">156</div>
                    <div className="stat-desc text-xs">This month</div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Preferences</h2>

                {/* Notifications */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Email Notifications</p>
                          <p className="text-sm text-base-content/70">
                            Receive updates via email
                          </p>
                        </div>
                        <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">System Alerts</p>
                          <p className="text-sm text-base-content/70">
                            Get notified about system updates
                          </p>
                        </div>
                        <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Weekly Reports</p>
                          <p className="text-sm text-base-content/70">
                            Receive weekly activity summaries
                          </p>
                        </div>
                        <input type="checkbox" className="toggle toggle-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Preferences */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Display</h3>
                    <div className="space-y-3">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Language</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>English</option>
                          <option>Filipino</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Date Format</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Time Zone</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>Asia/Manila (UTC+8)</option>
                          <option>Asia/Tokyo (UTC+9)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="card-title text-lg">Data Management</h3>
                    <div className="space-y-3">
                      <button className="btn btn-outline w-full justify-start">
                        📥 Download My Data
                      </button>
                      <button className="btn btn-outline w-full justify-start">
                        🗑️ Clear Cache
                      </button>
                      <button className="btn btn-error btn-outline w-full justify-start">
                        ⚠️ Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
