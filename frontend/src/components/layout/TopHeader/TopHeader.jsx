import { useAuth } from "../../../contexts/AuthContext.jsx";
import ThemeSelector from "../../common/ThemeSelector.jsx";
import { useState, useRef, useEffect } from "react";
import useClickOutside from "../../../hooks/useClickOutside.js";
import Theme from "../../../contexts/Theme.jsx";
import useApi from "../../../services/axios.js";

import { useNavigate, Link } from "react-router";

export default function TopHeader({ currentTheme, onThemeChange, sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const { getAssessorNotifications } = useApi();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const themeRef = useRef(null);
  const notificationRef = useRef(null);

  const themes = Theme();
  const theme = themes[currentTheme] || Object.values(themes)[0];

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(themeRef, () => setThemeOpen(false));
  useClickOutside(notificationRef, () => setNotificationOpen(false));

  const handleLogout = async () => {
    await logout();
    window.location.replace("/");
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getAssessorNotifications();
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleNotificationClick = (n) => {
    setNotificationOpen(false);
    navigate(`/directory?search=${encodeURIComponent(n.message.split(' for ')[1])}`);
  };

  return (
    <header
      className={`
        h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-4 sm:px-6 
        fixed top-0 right-0 z-30 transition-all duration-300
        left-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'}
      `}
    >
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {/* Mobile Menu Button - REMOVED */}

        <span className="text-sm text-base-content/60 font-medium">Dashboard</span>
      </div>

      {/* Right: Theme + User Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Icon */}
        <div className="dropdown dropdown-end" ref={notificationRef}>
          <button
            className="btn btn-ghost btn-circle btn-sm indicator"
            aria-label="Notifications"
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            {notifications.length > 0 && (
              <span className="indicator-item badge badge-xs badge-error"></span>
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {notificationOpen && (
            <div className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-box w-80 border border-base-300 mt-2">
              <div className="px-4 py-2 border-b border-base-200 flex justify-between items-center">
                <h3 className="font-bold text-sm">Notifications</h3>
                <span className="text-xs text-base-content/60">{notifications.length} Unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-base-content/60">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-200 last:border-0 transition-colors"
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'expired' ? 'bg-error' : 'bg-warning'}`}></div>
                        <div>
                          <p className="text-xs font-semibold">{n.type === 'expired' ? 'License Expired' : 'Missing Info'}</p>
                          <p className="text-xs text-base-content/80 mt-1">{n.message}</p>
                          {n.lgu && <p className="text-[10px] text-base-content/60 mt-1">{n.lgu}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Selector */}
        <div ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Change theme"
          >
            <span className="text-lg">{themes[currentTheme]?.icon || '🎨'}</span>
          </button>
          {themeOpen && (
            <div className="absolute right-20 top-14 z-50 menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-base-300">
              <li className="menu-title">
                <span className="text-base-content/80 font-semibold text-xs">Choose Theme</span>
              </li>
              {Object.entries(themes).map(([key, themeData]) => (
                <li key={key}>
                  <button
                    onClick={() => {
                      onThemeChange(key);
                      setThemeOpen(false);
                    }}
                    className={`justify-between ${currentTheme === key
                      ? "active bg-primary text-primary-content"
                      : "hover:bg-base-200"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{themeData.icon}</span>
                      <span className="text-sm">{themeData.name}</span>
                    </div>
                    {currentTheme === key && (
                      <span className="badge badge-success badge-sm">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="btn btn-ghost gap-2 hover:bg-base-200"
          >
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-8">
                <span className="text-xs">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-sm font-semibold">{user?.role || 'User'}</div>
              <div className="text-xs text-base-content/60">{user?.email?.split('@')[0] || 'user'}</div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <ul className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-base-300 mt-2">
              <li className="menu-title">
                <span className="text-xs font-semibold text-base-content/60">Account</span>
              </li>
              <li>
                <Link to="/profile" className="gap-2" onClick={() => setProfileOpen(false)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="gap-2" onClick={() => setProfileOpen(false)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </li>
              <div className="divider my-0"></div>
              <li>
                <a className="gap-2 text-error cursor-pointer" onClick={handleLogout}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
