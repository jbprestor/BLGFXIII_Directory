import { useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import UserLoginPage from "../../modals/users/UserLoginModal.jsx";
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
import UserCreateModal from "../../modals/users/UserCreateModal.jsx";
import api from "../../../services/axios.js";
import toast from "react-hot-toast";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const [userCreateOpen, setUserCreateOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const profileRef = useRef(null);
  const themeRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isScrolled = useScrollDetection();

  const themes = Theme();
  const theme = themes[currentTheme] || Object.values(themes)[0];

  const isLoggedIn = !!user;

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(themeRef, () => setThemeOpen(false));
  useClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));
  useEscapeKey(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setThemeOpen(false);
    setLoginOpen(false);
  });
  useBodyScrollLock(mobileMenuOpen || loginOpen);

  const navItems = useMemo(
    () => [
      { name: "Home", page: "home", icon: "🏠" },
      { name: "Directory", page: "directory", icon: "📁" },
      { name: "LGU Profile", page: "lgu-profile", icon: "🏢" },
      { name: "SMV Profiling", page: "smv-profiling", icon: "📊" },
      { name: "QRRPA Submission", page: "qrrpa-submission", icon: "📋" },
      // { name: "Create", page: "create", icon: "➕" },
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
    window.location.replace("/");

  }, [logout, showNotification]);

  const handleThemeChange = useCallback(
    (themeKey) => {
      onThemeChange(themeKey);
      setThemeOpen(false);
      showNotification(`Theme changed to ${themes[themeKey].name}`);
    },
    [onThemeChange, showNotification, themes]
  );

  const handleCreateUser = async (userData) => {
    setCreateUserLoading(true);
    const { registerUser } = api();
    try {
      const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        region: userData.region,
      };
      await registerUser(payload);
      setUserCreateOpen(false);
      toast.success("User created successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create user"
      );
      throw error;
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleLoginOpen = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);

  return (
    <>
      <NotificationToast notifications={notifications} theme={theme} />

      {/* Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg relative max-w-md w-full">
            <button
              className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
              onClick={handleLoginClose}
            >
              ✕
            </button>
            <UserLoginPage
              onSuccess={handleLoginClose}
              onClose={handleLoginClose}
              onRequestAccess={() => {
                setLoginOpen(false);
                setUserCreateOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {userCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg relative max-w-md w-full">
            <button
              className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
              onClick={() => setUserCreateOpen(false)}
            >
              ✕
            </button>
            <UserCreateModal
              isOpen={userCreateOpen}
              onClose={() => setUserCreateOpen(false)}
              onCreateUser={handleCreateUser}
              loading={createUserLoading}
            />
          </div>
        </div>
      )}

      {/* Navbar */}
      <div
        className={`navbar ${
          isScrolled
            ? "bg-base-100/95 backdrop-blur-md shadow-xl"
            : `bg-gradient-to-r ${theme.gradient}`
        } fixed top-0 z-40 transition-all duration-500 px-4 sm:px-6 lg:px-8`}
      >
        <div className="navbar-start">
          {isLoggedIn && (
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
          )}

          <Logo
            isScrolled={isScrolled}
            theme={theme}
            onClick={() => onNavigate("home")}
          />
        </div>

        {/* Desktop Navigation - Explicitly hidden on mobile/tablet */}
        {isLoggedIn && (
          <div className="navbar-center hidden lg:flex xl:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              {navItems.map((item) => (
                <li key={item.page}>
                  <a
                    onClick={() => onNavigate(item.page)}
                    className={`flex items-center py-2 px-4 rounded-lg transition-all duration-200 ${
                      currentPage === item.page
                        ? "bg-primary text-primary-content shadow-md"
                        : isScrolled
                        ? "text-base-content hover:bg-base-200/80"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    <span className="mr-2 text-lg">{item.icon}</span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="navbar-end gap-2">
          {/* Theme Selector - Always visible but responsive */}
          <div className="hidden sm:block">
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              isScrolled={isScrolled}
              themeRef={themeRef}
              themeOpen={themeOpen}
              setThemeOpen={setThemeOpen}
              theme={theme}
            />
          </div>

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
              className={`btn btn-primary text-sm px-3 sm:text-base sm:px-4 ${
                isScrolled
                  ? ""
                  : "btn-outline border-white text-white hover:bg-white hover:text-primary"
              }`}
            >
              <span className="hidden sm:inline">Log in</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Enhanced with theme selector */}
      {isLoggedIn && mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300"></div>
          <div
            ref={mobileMenuRef}
            className="fixed top-0 left-0 h-full w-80 max-w-full bg-base-100 shadow-xl z-40 transform transition-transform duration-300 ease-in-out"
          >
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                className="btn btn-ghost btn-circle"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-full pb-20">
              {/* Navigation Items */}
              <ul className="menu flex flex-col gap-2">
                {navItems.map((item) => (
                  <li key={item.page}>
                    <a
                      onClick={() => {
                        onNavigate(item.page);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center py-4 px-4 rounded-lg transition-all duration-200 text-lg ${
                        currentPage === item.page
                          ? "bg-primary text-primary-content shadow-md"
                          : "text-base-content hover:bg-base-200"
                      }`}
                    >
                      <span className="mr-3 text-xl">{item.icon}</span>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="divider my-6"></div>

              {/* Theme Selector in Mobile Menu */}
              <div className="px-2 mb-4 sm:hidden">
                <label className="label">
                  <span className="label-text font-medium">Theme</span>
                </label>
                <ThemeSelector
                  currentTheme={currentTheme}
                  onThemeChange={handleThemeChange}
                  isScrolled={true}
                  themeRef={themeRef}
                  themeOpen={themeOpen}
                  setThemeOpen={setThemeOpen}
                  theme={theme}
                />
              </div>

              {/* Logout Button */}
              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-error w-full"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-16"></div>

      <style>{`
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .mobile-menu {
    animation: slideIn 0.3s ease-out;
  }

  .nav-item {
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-item::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: currentColor;
    transition: all 0.2s ease;
    transform: translateX(-50%);
  }

  .nav-item:hover::after {
    width: 70%;
  }

  .nav-item.active::after {
    width: 70%;
  }

  @media (max-width: 1023px) {
    .navbar-center {
      display: none !important;
    }
  }
`}</style>
    </>
  );
}
