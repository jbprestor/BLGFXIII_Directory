import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// Custom hooks for better organization
const useScrollDetection = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isScrolled;
};

const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

const useEscapeKey = (callback) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        callback();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [callback]);
};

const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLocked]);
};

// Theme configuration
const themes = {
  default: {
    name: "Corporate Blue",
    daisyTheme: "corporate",
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    accent: "primary",
    icon: "🌊",
    colors: { primary: "#570df8", secondary: "#f000b8", accent: "#37cdbe" },
    shadow: "0 4px 14px 0 rgba(87, 13, 248, 0.2)",
    border: "1px solid rgba(87, 13, 248, 0.15)",
  },
  emerald: {
    name: "Emerald Forest",
    daisyTheme: "emerald",
    gradient: "from-emerald-600 via-green-600 to-teal-700",
    accent: "success",
    icon: "🌲",
    colors: { primary: "#059669", secondary: "#10b981", accent: "#14b8a6" },
    shadow: "0 4px 14px 0 rgba(5, 150, 105, 0.2)",
    border: "1px solid rgba(5, 150, 105, 0.15)",
  },
  sunset: {
    name: "Sunset Warmth",
    daisyTheme: "sunset",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    accent: "warning",
    icon: "🌅",
    colors: { primary: "#ea580c", secondary: "#f97316", accent: "#fb923c" },
    shadow: "0 4px 14px 0 rgba(234, 88, 12, 0.2)",
    border: "1px solid rgba(234, 88, 12, 0.15)",
  },
  synthwave: {
    name: "Synthwave Neon",
    daisyTheme: "synthwave",
    gradient: "from-purple-600 via-pink-600 to-blue-600",
    accent: "secondary",
    icon: "🌈",
    colors: { primary: "#e779c1", secondary: "#58c7f3", accent: "#f3cc30" },
    shadow: "0 4px 14px 0 rgba(231, 121, 193, 0.25)",
    border: "1px solid rgba(231, 121, 193, 0.2)",
  },
  retro: {
    name: "Retro Vintage",
    daisyTheme: "retro",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    accent: "warning",
    icon: "📻",
    colors: { primary: "#ef9995", secondary: "#a4cbb4", accent: "#dc8850" },
    shadow: "0 4px 14px 0 rgba(239, 153, 149, 0.2)",
    border: "1px solid rgba(239, 153, 149, 0.15)",
  },
  cyberpunk: {
    name: "Cyberpunk Dark",
    daisyTheme: "cyberpunk",
    gradient: "from-yellow-400 via-pink-500 to-purple-600",
    accent: "accent",
    icon: "🤖",
    colors: { primary: "#ff7598", secondary: "#75d1f0", accent: "#c7f59b" },
    shadow: "0 4px 14px 0 rgba(255, 117, 152, 0.25)",
    border: "1px solid rgba(255, 117, 152, 0.2)",
  },
  valentine: {
    name: "Valentine Pink",
    daisyTheme: "valentine",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    accent: "secondary",
    icon: "💖",
    colors: { primary: "#e96d7b", secondary: "#a991f7", accent: "#88dbdd" },
    shadow: "0 4px 14px 0 rgba(233, 109, 123, 0.2)",
    border: "1px solid rgba(233, 109, 123, 0.15)",
  },
  aqua: {
    name: "Aqua Marine",
    daisyTheme: "aqua",
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    accent: "info",
    icon: "🌊",
    colors: { primary: "#09ecf3", secondary: "#966fb3", accent: "#ffe999" },
    shadow: "0 4px 14px 0 rgba(9, 236, 243, 0.2)",
    border: "1px solid rgba(9, 236, 243, 0.15)",
  },
};

// Sub-components for better organization
const Logo = ({ isScrolled, theme, onClick }) => (
  <div className="flex items-center space-x-3">
    <div className="avatar">
      <div className="w-10 rounded-full ring-2 ring-offset-2 ring-offset-base-100 ring-primary/30">
        <img
          src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
          alt="BLGF Logo"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextElementSibling.style.display = "flex";
          }}
        />
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-content font-bold hidden">
          B
        </div>
      </div>
    </div>
    <button
      onClick={onClick}
      className={`btn btn-ghost text-xl font-bold transition-all duration-300 ${
        isScrolled
          ? "text-primary hover:text-primary-focus"
          : "text-white hover:text-primary-content"
      } hover:scale-105`}
      aria-label="Go to homepage"
    >
      <span className="hidden md:inline">BLGF Portal</span>
      <span className="md:hidden">BLGF</span>
    </button>
  </div>
);

const NavItem = ({ item, currentPage, isScrolled, onClick }) => (
  <li>
    <button
      onClick={() => onClick(item.name, item.page)}
      className={`btn btn-ghost rounded-btn transition-all duration-300 ${
        currentPage === item.page
          ? isScrolled
            ? "btn-primary shadow-md"
            : "bg-white/20 text-white shadow-md"
          : isScrolled
          ? "hover:btn-primary hover:shadow-md"
          : "text-white hover:bg-white/10 hover:shadow-md"
      }`}
      aria-current={currentPage === item.page ? "page" : undefined}
    >
      <span className="text-sm">{item.icon}</span>
      <span className="hidden lg:inline">{item.name}</span>
    </button>
  </li>
);

const NotificationToast = ({ notifications, theme }) => (
  <div className="toast toast-top toast-center sm:toast-end z-50">
    {notifications.map((notification) => (
      <div
        key={notification.id}
        className={`alert ${
          notification.type === "success" ? "alert-success" : "alert-error"
        } shadow-lg mx-4 sm:mx-0 animate-fade-in-down`}
        style={{
          maxWidth: "90vw",
          boxShadow: theme.shadow,
        }}
      >
        <div className="flex items-center">
          <span className="text-lg mr-2">
            {notification.type === "success" ? "✓" : "✗"}
          </span>
          <span className="font-medium text-sm sm:text-base">
            {notification.message}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const ThemeSelector = ({
  currentTheme,
  onThemeChange,
  isScrolled,
  themeRef,
  themeOpen,
  setThemeOpen,
  theme,
}) => (
  <div className="dropdown dropdown-end hidden sm:block" ref={themeRef}>
    <button
      onClick={() => setThemeOpen(!themeOpen)}
      className={`btn btn-ghost btn-circle transition-all duration-300 ${
        isScrolled ? "" : "text-white"
      }`}
      aria-label="Change theme"
      aria-expanded={themeOpen}
      style={themeOpen ? { transform: "rotate(180deg)" } : {}}
    >
      <span className="text-xl">{themes[currentTheme].icon}</span>
    </button>
    {themeOpen && (
      <ul
        className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-64 mt-3"
        style={{
          border: theme.border,
          boxShadow: theme.shadow,
        }}
        role="menu"
      >
        <li className="menu-title">
          <span>Choose Theme</span>
        </li>
        {Object.entries(themes).map(([key, themeData]) => (
          <li key={key}>
            <button
              onClick={() => onThemeChange(key)}
              className={`justify-between transition-colors duration-300 ${
                currentTheme === key
                  ? "active bg-primary/10"
                  : "hover:bg-base-200"
              }`}
              role="menuitem"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{themeData.icon}</span>
                <div>
                  <div className="font-medium">{themeData.name}</div>
                  <div
                    className={`w-16 h-2 rounded-full bg-gradient-to-r ${themeData.gradient}`}
                  ></div>
                </div>
              </div>
              {currentTheme === key && (
                <span className="badge badge-primary">✓</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const UserMenu = ({
  isLoggedIn,
  isScrolled,
  profileRef,
  profileOpen,
  setProfileOpen,
  showNotification,
  handleLogout,
  theme,
}) => (
  <div className="dropdown dropdown-end" ref={profileRef}>
    <button
      onClick={() => setProfileOpen(!profileOpen)}
      className="btn btn-ghost btn-circle avatar transition-all duration-300"
      aria-label="User menu"
      aria-expanded={profileOpen}
    >
      <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold ring-2 ring-offset-2 ring-offset-base-100 ring-primary/30">
        U
      </div>
    </button>
    {profileOpen && (
      <ul
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-2xl bg-base-100 rounded-box w-52"
        style={{
          border: theme.border,
          boxShadow: theme.shadow,
        }}
        role="menu"
      >
        <li className="menu-title">
          <span>John Doe</span>
          <span className="text-xs opacity-70">john.doe@blgf.gov.ph</span>
        </li>
        <li>
          <button
            onClick={() => {
              showNotification("Opening profile...");
              setProfileOpen(false);
            }}
            role="menuitem"
            className="transition-colors duration-300 hover:bg-base-200"
          >
            <span>👤</span>
            Profile
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              showNotification("Opening settings...");
              setProfileOpen(false);
            }}
            role="menuitem"
            className="transition-colors duration-300 hover:bg-base-200"
          >
            <span>⚙️</span>
            Settings
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              showNotification("Opening help center...");
              setProfileOpen(false);
            }}
            role="menuitem"
            className="transition-colors duration-300 hover:bg-base-200"
          >
            <span>❓</span>
            Help
          </button>
        </li>
        <div className="divider my-1"></div>
        <li>
          <button
            onClick={handleLogout}
            className="text-error transition-colors duration-300 hover:bg-error/10"
            role="menuitem"
          >
            <span>🚪</span>
            Sign out
          </button>
        </li>
      </ul>
    )}
  </div>
);

export default function Navbar({
  currentPage,
  onNavigate,
  currentTheme,
  onThemeChange,
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const themeRef = useRef(null);

  const isScrolled = useScrollDetection();
  const theme = themes[currentTheme] || themes.default;

  // Use custom hooks
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(themeRef, () => setThemeOpen(false));
  useEscapeKey(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setThemeOpen(false);
  });
  useBodyScrollLock(mobileMenuOpen);

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
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const handleLinkClick = useCallback(
    (name, page) => {
      showNotification(`Navigating to ${name}`);
      setMobileMenuOpen(false);
      onNavigate(page);
    },
    [showNotification, onNavigate]
  );

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
    showNotification("Successfully logged in!");
    setMobileMenuOpen(false);
  }, [showNotification]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setProfileOpen(false);
    showNotification("Successfully logged out!");
    setMobileMenuOpen(false);
  }, [showNotification]);

  const handleThemeChange = useCallback(
    (themeKey) => {
      onThemeChange(themeKey);
      setThemeOpen(false);
      showNotification(`Theme changed to ${themes[themeKey].name}!`);
    },
    [onThemeChange, showNotification]
  );

  return (
    <>
      <NotificationToast notifications={notifications} theme={theme} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPage={currentPage}
        theme={theme}
        themes={themes}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        navItems={navItems}
        onLinkClick={handleLinkClick}
      />

      {/* Main Navbar */}
      <div
        className={`navbar ${
          isScrolled
            ? "bg-base-100/95 backdrop-blur-md shadow-xl"
            : `bg-gradient-to-r ${theme.gradient}`
        } fixed top-0 z-40 transition-all duration-500 px-4 sm:px-6`}
        style={
          isScrolled
            ? {
                boxShadow: theme.shadow,
                borderBottom: theme.border,
              }
            : {}
        }
      >
        <div className="navbar-start">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`btn btn-ghost btn-circle lg:hidden transition-all duration-300 ${
              isScrolled ? "" : "text-white"
            }`}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
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

          {/* Logo - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden sm:flex">
            <Logo
              isScrolled={isScrolled}
              theme={theme}
              onClick={() => handleLinkClick("Home", "home")}
            />
          </div>

          {/* Mobile Logo - Centered */}
          <div className="flex sm:hidden flex-1 justify-center">
            <button
              onClick={() => handleLinkClick("Home", "home")}
              className={`btn btn-ghost text-lg font-bold transition-all duration-300 ${
                isScrolled ? "text-primary" : "text-white"
              }`}
            >
              BLGF Portal
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-1">
            {navItems.map((item) => (
              <NavItem
                key={item.page}
                item={item}
                currentPage={currentPage}
                isScrolled={isScrolled}
                onClick={handleLinkClick}
              />
            ))}
          </ul>
        </div>

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

          {/* Mobile Quick Actions */}
          <div className="flex sm:hidden space-x-1">
            {isLoggedIn ? (
              <button className="btn btn-ghost btn-circle avatar">
                <div className="w-9 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold ring-2 ring-offset-2 ring-offset-base-100 ring-primary/30">
                  U
                </div>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className={`btn btn-sm transition-all duration-300 ${
                  isScrolled
                    ? "btn-primary"
                    : "btn-ghost text-white border-white hover:bg-white hover:text-primary"
                }`}
              >
                Sign in
              </button>
            )}
          </div>

          {/* Desktop Authentication */}
          <div className="hidden sm:flex space-x-2">
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
              <div className="space-x-2">
                <button
                  onClick={handleLogin}
                  className={`btn btn-ghost transition-all duration-300 ${
                    isScrolled
                      ? "btn-outline"
                      : "text-white border-white hover:bg-white hover:text-base-content"
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={handleLogin}
                  className="btn btn-primary transition-all duration-300 hover:shadow-lg"
                  style={{ boxShadow: theme.shadow }}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}

// Mobile Menu Component (extracted for better organization)
const MobileMenu = ({
  isOpen,
  onClose,
  currentPage,
  theme,
  themes,
  currentTheme,
  onThemeChange,
  isLoggedIn,
  onLogin,
  onLogout,
  navItems,
  onLinkClick,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:hidden`}
    >
      <div className="absolute inset-0 bg-base-100 flex flex-col">
        {/* Mobile Menu Header */}
        <div
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme.gradient} text-white`}
        >
          <div className="flex items-center space-x-3">
            <div className="avatar">
              <div className="w-10 rounded-full ring-2 ring-offset-2 ring-offset-base-100 ring-white/30">
                <img
                  src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
                  alt="BLGF Logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold hidden">
                  B
                </div>
              </div>
            </div>
            <span className="font-bold text-lg">BLGF Portal</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle text-white"
            aria-label="Close menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Items */}
          <div className="p-4">
            <h3 className="text-xs uppercase tracking-wider text-base-content/60 font-semibold mb-2 px-4">
              Navigation
            </h3>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.page}>
                  <button
                    onClick={() => onLinkClick(item.name, item.page)}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      currentPage === item.page
                        ? "bg-primary text-primary-content shadow-md"
                        : "hover:bg-base-200"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                    {currentPage === item.page && (
                      <span className="ml-auto">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="divider mx-4"></div>

          {/* Theme Selector in Mobile Menu */}
          <div className="p-4">
            <h3 className="text-xs uppercase tracking-wider text-base-content/60 font-semibold mb-2 px-4">
              Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(themes).map(([key, themeData]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentTheme === key
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-1">{themeData.icon}</div>
                  <div className="text-xs font-medium">
                    {themeData.name.split(" ")[0]}
                  </div>
                  {currentTheme === key && (
                    <div className="badge badge-primary badge-xs mt-1">
                      Active
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="divider mx-4"></div>

          {/* User Section in Mobile Menu */}
          <div className="p-4">
            {isLoggedIn ? (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-base-content/60 font-semibold mb-2 px-4">
                  Account
                </h3>
                <div className="bg-base-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold ring-2 ring-offset-2 ring-offset-base-100 ring-primary/30">
                        U
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">John Doe</div>
                      <div className="text-xs opacity-70">
                        john.doe@blgf.gov.ph
                      </div>
                    </div>
                  </div>
                </div>
                <ul className="space-y-1">
                  <li>
                    <button className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-base-200">
                      <span>👤</span>
                      <span>Profile</span>
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-base-200">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-base-200">
                      <span>❓</span>
                      <span>Help & Support</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onLogout}
                      className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-error/10 text-error"
                    >
                      <span>🚪</span>
                      <span>Sign out</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={onLogin}
                  className="btn btn-primary btn-block transition-all duration-300 hover:shadow-lg"
                  style={{ boxShadow: theme.shadow }}
                >
                  Sign in
                </button>
                <button
                  onClick={onLogin}
                  className="btn btn-outline btn-block transition-all duration-300"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
