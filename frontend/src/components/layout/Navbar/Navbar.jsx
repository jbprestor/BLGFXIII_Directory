import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import LoginPage from "../../modals/LoginModal.jsx";
import Logo from "./Logo";
import Theme from "../../../contexts/Theme.jsx";
import useScrollDetection from "../../../hooks/useScrollDetection.js";
import useClickOutside from "../../../hooks/useClickOutside.js";
import useEscapeKey from "../../../hooks/useEscapeKey.js";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock.js";
import ThemeSelector from "../../common/ThemeSelector.jsx";
import NavItem from "./NavItem.jsx";
import NotificationToast from "./NotificationToast.jsx";
import UserMenu from "./UserMenu.jsx";

export default function Navbar({
  currentPage,
  onNavigate,
  currentTheme,
  onThemeChange,
}) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false); // <-- modal state
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const themeRef = useRef(null);

  const isScrolled = useScrollDetection();

  const themes = Theme(); // full theme set
  const theme = themes[currentTheme] || Object.values(themes)[0];

  const isLoggedIn = !!user;

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(themeRef, () => setThemeOpen(false));
  useEscapeKey(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setThemeOpen(false);
    setLoginOpen(false); // close modal on escape
  });
  useBodyScrollLock(mobileMenuOpen || loginOpen);

  const navItems = useMemo(
    () => [
      { name: "Home", page: "home", icon: "🏠" },
      { name: "Directory", page: "directory", icon: "📁" },
      { name: "SMV Profiling", page: "smv-profiling", icon: "📊" },
      { name: "QRRPA Submission", page: "qrrpa-submission", icon: "📋" },
      { name: "Create", page: "create", icon: "➕" },
    ],
    []
  );

  const showNotification = useCallback((message, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    showNotification("Logged out successfully!");
  }, [logout, showNotification]);

  const handleThemeChange = useCallback(
    (themeKey) => {
      onThemeChange(themeKey);
      setThemeOpen(false);
      showNotification(`Theme changed to ${themes[themeKey].name}`);
    },
    [onThemeChange, showNotification]
  );

  const handleLoginOpen = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);

  return (
    <>
      {/* Notifications */}
      <NotificationToast notifications={notifications} theme={theme} />

      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 btn btn-sm btn-circle"
              onClick={handleLoginClose}
            >
              ✕
            </button>
            <LoginPage onSuccess={handleLoginClose} />
          </div>
        </div>
      )}

      {/* Navbar */}
      <div
        className={`navbar ${
          isScrolled
            ? "bg-base-100/95 backdrop-blur-md shadow-xl"
            : `bg-gradient-to-r ${theme.gradient}`
        } fixed top-0 z-40 transition-all duration-500 px-4 sm:px-6`}
      >
        <div className="navbar-start">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`btn btn-ghost btn-circle lg:hidden ${
              isScrolled ? "" : "text-white"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Logo
            isScrolled={isScrolled}
            theme={theme}
            onClick={() => onNavigate("home")}
          />
        </div>

        {/* Navbar Center */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-1">
            {navItems.map((item) => (
              <NavItem
                key={item.page}
                item={item}
                currentPage={currentPage}
                isScrolled={isScrolled}
                onClick={(name, page) => onNavigate(page)}
              />
            ))}
          </ul>
        </div>

        {/* Navbar End */}
        <div className="navbar-end space-x-2">
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            isScrolled={isScrolled}
            themeRef={themeRef}
            themeOpen={themeOpen}
            setThemeOpen={setThemeOpen}
            theme={theme}
          />

          {isLoggedIn ? (
            <UserMenu
              isLoggedIn={isLoggedIn}
              isScrolled={isScrolled}
              profileRef={profileRef}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              showNotification={showNotification}
              handleLogout={handleLogout}
              theme={theme}
            />
          ) : (
            <button
              onClick={handleLoginOpen}
              className={`btn btn-primary ${
                isScrolled ? "" : "btn-outline text-white"
              }`}
            >
              Log in
            </button>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16"></div>
    </>
  );
}
