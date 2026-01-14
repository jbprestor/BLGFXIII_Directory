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
      //{ name: "Settings", page: "settings", icon: "⚙️" },
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
      const result = await registerUser(payload);
      setUserCreateOpen(false);
      return result; // Return result for modal to handle success
    } catch (error) {
      // Just re-throw error for modal to handle
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
      <header
        role="banner"
        className={`navbar ${isScrolled
          ? "bg-base-100/95 backdrop-blur-md shadow-xl"
          : `bg-gradient-to-r ${theme.gradient}`
          } fixed top-0 z-40 transition-all duration-500 px-3 sm:px-6 lg:px-8`}
      >
        <div className="navbar-start">
          {isLoggedIn && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className={`hamburger-menu btn btn-ghost btn-circle ${isScrolled ? "text-base-content" : "text-white"
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
                    className={`nav-item flex items-center py-2 px-4 rounded-lg transition-all duration-300 cursor-pointer ${currentPage === item.page
                      ? "active bg-primary text-primary-content shadow-lg border-2 border-primary-focus transform scale-105"
                      : isScrolled
                        ? "text-base-content hover:bg-base-200/80 hover:shadow-md"
                        : "text-white hover:bg-white/20 hover:shadow-md"
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

        <nav aria-label="User controls" className="navbar-end gap-2">
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
              aria-label="Open login dialog"
              className={`btn btn-primary text-sm px-3 sm:text-base sm:px-4 ${isScrolled
                ? ""
                : "btn-outline border-white text-white hover:bg-white hover:text-primary"
                }`}
            >
              <span className="hidden sm:inline">Log in</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </nav>
      </header>

      {/* Mobile Menu - Enhanced with theme selector */}
      {isLoggedIn && mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300"></div>
          <div
            ref={mobileMenuRef}
            className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-base-100 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary to-primary-focus text-primary-content border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full ring-2 ring-white/20">
                    <img
                      src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
                      alt="BLGF Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold leading-tight">BLGF</h2>
                  <span className="text-xs opacity-90">Caraga</span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-circle btn-sm text-primary-content hover:bg-white/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-3 overflow-y-auto h-full pb-20 bg-base-50">
              {/* Navigation Items */}
              <ul className="menu flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.page}>
                    <a
                      onClick={() => {
                        onNavigate(item.page);
                        setMobileMenuOpen(false);
                      }}
                      className={`mobile-nav-item flex items-center py-3 px-3 rounded-xl transition-all duration-300 text-base cursor-pointer ${currentPage === item.page
                        ? "active bg-primary text-primary-content shadow-lg font-medium border-l-4 border-primary-focus"
                        : "text-base-content hover:bg-base-200/70 hover:shadow-sm hover:translate-x-1"
                        }`}
                    >
                      <span className="mr-3 text-lg opacity-80">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                      {currentPage === item.page && (
                        <span className="text-xs opacity-75">●</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="divider my-4 opacity-30"></div>

              {/* Theme Selector in Mobile Menu */}
              <div className="px-2 mb-4">
                <label className="label py-2">
                  <span className="label-text font-semibold text-sm text-base-content">🎨 Theme</span>
                </label>
                <div className="dropdown dropdown-end w-full">
                  <button
                    onClick={() => setThemeOpen(!themeOpen)}
                    className="btn btn-outline w-full justify-between text-base-content"
                    aria-label="Change theme"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{themes[currentTheme]?.icon}</span>
                      <span className="text-sm">{themes[currentTheme]?.name}</span>
                    </div>
                    <span className={`transition-transform duration-200 ${themeOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {themeOpen && (
                    <ul className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-full mt-2 border border-base-300">
                      <li className="menu-title">
                        <span className="text-base-content/80 font-semibold text-xs">Choose Theme</span>
                      </li>
                      {Object.entries(themes).map(([key, themeData]) => (
                        <li key={key}>
                          <button
                            onClick={() => {
                              handleThemeChange(key);
                              setThemeOpen(false);
                            }}
                            className={`justify-between transition-colors duration-300 ${currentTheme === key
                              ? "active bg-primary text-primary-content font-semibold"
                              : "hover:bg-base-200 text-base-content"
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{themeData.icon}</span>
                              <span className="text-sm font-medium">{themeData.name}</span>
                            </div>
                            {currentTheme === key && (
                              <span className="badge badge-success badge-sm">✓</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <div className="px-2 mt-6">
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-error w-full gap-2 rounded-xl"
                >
                  <span className="text-sm">🚪</span>
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

  @keyframes activeGlow {
    0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
    100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
  }

  .mobile-menu {
    animation: slideIn 0.3s ease-out;
  }

  .nav-item {
    transition: all 0.3s ease;
    position: relative;
  }

  .nav-item::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 3px;
    background: currentColor;
    transition: all 0.3s ease;
    transform: translateX(-50%);
    border-radius: 2px;
  }

  .nav-item:hover::after {
    width: 80%;
  }

  .nav-item.active::after {
    width: 90%;
    background: var(--p);
  }

  /* Active navigation item glowing effect */
  .nav-item.active {
    animation: activeGlow 2s ease-in-out infinite;
  }

  /* Mobile active item styling */
  .mobile-nav-item.active {
    position: relative;
    background: linear-gradient(135deg, var(--p) 0%, var(--pf) 100%);
  }

  .mobile-nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--pc);
    border-radius: 0 4px 4px 0;
  }

  .mobile-nav-item:hover {
    transform: translateX(2px);
  }

  .mobile-nav-item.active:hover {
    transform: none;
  }

  @media (max-width: 1023px) {
    .navbar-center {
      display: none !important;
    }
  }

  @media (min-width: 1024px) {
    .hamburger-menu {
      display: none !important;
    }
  }
`}</style>
    </>
  );
}
