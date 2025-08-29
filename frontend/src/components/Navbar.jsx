import { useState, useEffect, useRef } from "react";

export default function Navbar({ currentPage, onNavigate, currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const themeRef = useRef(null);

  // DaisyUI themes with enhanced configurations
  const themes = {
    default: {
      name: "Corporate Blue",
      daisyTheme: "corporate",
      gradient: "from-blue-600 via-indigo-600 to-purple-700",
      accent: "primary",
      icon: "🌊",
      colors: {
        primary: "#570df8",
        secondary: "#f000b8",
        accent: "#37cdbe"
      }
    },
    emerald: {
      name: "Emerald Forest",
      daisyTheme: "emerald",
      gradient: "from-emerald-600 via-green-600 to-teal-700",
      accent: "success",
      icon: "🌲",
      colors: {
        primary: "#059669",
        secondary: "#10b981",
        accent: "#14b8a6"
      }
    },
    sunset: {
      name: "Sunset Warmth",
      daisyTheme: "sunset",
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accent: "warning",
      icon: "🌅",
      colors: {
        primary: "#ea580c",
        secondary: "#f97316",
        accent: "#fb923c"
      }
    },
    synthwave: {
      name: "Synthwave Neon",
      daisyTheme: "synthwave",
      gradient: "from-purple-600 via-pink-600 to-blue-600",
      accent: "secondary",
      icon: "🌈",
      colors: {
        primary: "#e779c1",
        secondary: "#58c7f3",
        accent: "#f3cc30"
      }
    },
    retro: {
      name: "Retro Vintage",
      daisyTheme: "retro",
      gradient: "from-amber-500 via-orange-500 to-red-600",
      accent: "warning",
      icon: "📻",
      colors: {
        primary: "#ef9995",
        secondary: "#a4cbb4",
        accent: "#dc8850"
      }
    },
    cyberpunk: {
      name: "Cyberpunk Dark",
      daisyTheme: "cyberpunk",
      gradient: "from-yellow-400 via-pink-500 to-purple-600",
      accent: "accent",
      icon: "🤖",
      colors: {
        primary: "#ff7598",
        secondary: "#75d1f0",
        accent: "#c7f59b"
      }
    },
    valentine: {
      name: "Valentine Pink",
      daisyTheme: "valentine",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      accent: "secondary",
      icon: "💖",
      colors: {
        primary: "#e96d7b",
        secondary: "#a991f7",
        accent: "#88dbdd"
      }
    },
    aqua: {
      name: "Aqua Marine",
      daisyTheme: "aqua",
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      accent: "info",
      icon: "🌊",
      colors: {
        primary: "#09ecf3",
        secondary: "#966fb3",
        accent: "#ffe999"
      }
    }
  };

  const theme = themes[currentTheme] || themes.default;

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setProfileOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleLinkClick = (name, page) => {
    showNotification(`Navigating to ${name}`);
    setIsOpen(false);
    onNavigate(page);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    showNotification("Successfully logged in!");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfileOpen(false);
    showNotification("Successfully logged out!");
  };

  const handleThemeChange = (themeKey) => {
    onThemeChange(themeKey);
    setThemeOpen(false);
    showNotification(`Theme changed to ${themes[themeKey].name}!`);
  };

  const navItems = [
    { name: "Home", page: "home", icon: "🏠" },
    { name: "Directory", page: "directory", icon: "📁" },
    { name: "SMV Profiling", page: "smv-profiling", icon: "📊" },
    { name: "QRRPA Submission", page: "qrrpa-submission", icon: "📋" },
    { name: "Create", page: "create", icon: "➕" },
  ];

  return (
    <>
      {/* Toast Notifications using DaisyUI */}
      <div className="toast toast-top toast-end z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`alert ${
              notification.type === 'success' ? 'alert-success' : 'alert-error'
            } shadow-lg animate-pulse`}
          >
            <div>
              <span>{notification.type === 'success' ? '✓' : '✗'}</span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={`navbar ${isScrolled ? 'bg-base-100/95 backdrop-blur-md shadow-xl' : `bg-gradient-to-r ${theme.gradient}`} fixed top-0 z-40 transition-all duration-500`}>
        <div className="navbar-start">
          {/* Mobile Menu Button */}
          <div className="dropdown lg:hidden">
            <div tabIndex={0} role="button" className={`btn btn-ghost ${isScrolled ? '' : 'text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              {navItems.map((item) => (
                <li key={item.page}>
                  <a onClick={() => handleLinkClick(item.name, item.page)} className={currentPage === item.page ? 'active' : ''}>
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img 
                  src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png" 
                  alt="BLGF Logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-content font-bold hidden">
                  B
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleLinkClick("Home", "home")}
              className={`btn btn-ghost text-xl font-bold ${isScrolled ? 'text-primary' : 'text-white'} hover:scale-105 transition-transform`}
            >
              BLGF Portal
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {navItems.map((item) => (
              <li key={item.page}>
                <a 
                  onClick={() => handleLinkClick(item.name, item.page)}
                  className={`btn btn-ghost ${
                    currentPage === item.page 
                      ? isScrolled 
                        ? 'btn-primary' 
                        : 'bg-white/20 text-white'
                      : isScrolled
                        ? 'hover:btn-primary'
                        : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end space-x-2">
          {/* Theme Selector */}
          <div className="dropdown dropdown-end" ref={themeRef}>
            <div tabIndex={0} role="button" className={`btn btn-ghost ${isScrolled ? '' : 'text-white'}`}>
              <span className="text-lg">{theme.icon}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64">
              <li className="menu-title">
                <span>Choose Theme</span>
              </li>
              {Object.entries(themes).map(([key, themeData]) => (
                <li key={key}>
                  <a 
                    onClick={() => handleThemeChange(key)}
                    className={`justify-between ${currentTheme === key ? 'active' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{themeData.icon}</span>
                      <div>
                        <div className="font-medium">{themeData.name}</div>
                        <div className={`w-16 h-2 rounded-full bg-gradient-to-r ${themeData.gradient}`}></div>
                      </div>
                    </div>
                    {currentTheme === key && <span className="badge badge-primary">✓</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Authentication */}
          {isLoggedIn ? (
            <div className="dropdown dropdown-end" ref={profileRef}>
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                  U
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span>John Doe</span>
                  <span className="text-xs opacity-70">john.doe@blgf.gov.ph</span>
                </li>
                <li>
                  <a onClick={() => {
                    showNotification("Opening profile...");
                    setProfileOpen(false);
                  }}>
                    <span>👤</span>
                    Profile
                  </a>
                </li>
                <li>
                  <a onClick={() => {
                    showNotification("Opening settings...");
                    setProfileOpen(false);
                  }}>
                    <span>⚙️</span>
                    Settings
                  </a>
                </li>
                <li>
                  <a onClick={() => {
                    showNotification("Opening help center...");
                    setProfileOpen(false);
                  }}>
                    <span>❓</span>
                    Help
                  </a>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <a onClick={handleLogout} className="text-error">
                    <span>🚪</span>
                    Sign out
                  </a>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-x-2">
              <button 
                onClick={handleLogin}
                className={`btn btn-ghost ${isScrolled ? 'btn-outline' : 'text-white border-white hover:bg-white hover:text-base-content'}`}
              >
                Log in
              </button>
              <button 
                onClick={handleLogin}
                className="btn btn-primary"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}