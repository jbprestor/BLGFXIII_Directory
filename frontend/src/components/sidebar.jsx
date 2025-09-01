// components/Sidebar.jsx
import { useState, useEffect, useRef } from "react";

export default function Sidebar({ 
  currentPage, 
  onNavigate, 
  currentTheme, 
  onThemeChange,
  isOpen,
  onClose 
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const profileRef = useRef(null);
  const themeRef = useRef(null);

  // Same themes as Navbar
  const themes = {
    default: {
      name: "Corporate Blue",
      daisyTheme: "corporate",
      gradient: "from-blue-600 via-indigo-600 to-purple-700",
      accent: "primary",
      icon: "🌊",
      colors: { primary: "#570df8", secondary: "#f000b8", accent: "#37cdbe" }
    },
    emerald: {
      name: "Emerald Forest",
      daisyTheme: "emerald",
      gradient: "from-emerald-600 via-green-600 to-teal-700",
      accent: "success",
      icon: "🌲",
      colors: { primary: "#059669", secondary: "#10b981", accent: "#14b8a6" }
    },
    sunset: {
      name: "Sunset Warmth",
      daisyTheme: "sunset",
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accent: "warning",
      icon: "🌅",
      colors: { primary: "#ea580c", secondary: "#f97316", accent: "#fb923c" }
    },
    synthwave: {
      name: "Synthwave Neon",
      daisyTheme: "synthwave",
      gradient: "from-purple-600 via-pink-600 to-blue-600",
      accent: "secondary",
      icon: "🌈",
      colors: { primary: "#e779c1", secondary: "#58c7f3", accent: "#f3cc30" }
    },
    retro: {
      name: "Retro Vintage",
      daisyTheme: "retro",
      gradient: "from-amber-500 via-orange-500 to-red-600",
      accent: "warning",
      icon: "📻",
      colors: { primary: "#ef9995", secondary: "#a4cbb4", accent: "#dc8850" }
    },
    cyberpunk: {
      name: "Cyberpunk Dark",
      daisyTheme: "cyberpunk",
      gradient: "from-yellow-400 via-pink-500 to-purple-600",
      accent: "accent",
      icon: "🤖",
      colors: { primary: "#ff7598", secondary: "#75d1f0", accent: "#c7f59b" }
    },
    valentine: {
      name: "Valentine Pink",
      daisyTheme: "valentine",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      accent: "secondary",
      icon: "💖",
      colors: { primary: "#e96d7b", secondary: "#a991f7", accent: "#88dbdd" }
    },
    aqua: {
      name: "Aqua Marine",
      daisyTheme: "aqua",
      gradient: "from-cyan-500 via-blue-500 to-indigo-600",
      accent: "info",
      icon: "🌊",
      colors: { primary: "#09ecf3", secondary: "#966fb3", accent: "#ffe999" }
    }
  };

  const theme = themes[currentTheme] || themes.default;

  // Enhanced navigation items with sub-items
  const navItems = [
    { 
      name: "Dashboard", 
      page: "home", 
      icon: "🏠", 
      description: "Overview & Analytics" 
    },
    { 
      name: "Personnel Directory", 
      page: "directory", 
      icon: "📁", 
      description: "Manage BLGF Personnel",
      subItems: [
        { name: "All Personnel", page: "directory", icon: "👥" },
        { name: "Add New", page: "create", icon: "➕" },
        { name: "Reports", page: "reports", icon: "📊" }
      ]
    },
    { 
      name: "SMV Profiling", 
      page: "smv-profiling", 
      icon: "📊", 
      description: "Schedule & Market Values" 
    },
    { 
      name: "QRRPA Submission", 
      page: "qrrpa-submission", 
      icon: "📋", 
      description: "Quarterly Reports & Submissions" 
    },
    { 
      name: "Settings", 
      page: "settings", 
      icon: "⚙️", 
      description: "System Configuration",
      subItems: [
        { name: "Profile", page: "profile", icon: "👤" },
        { name: "Preferences", page: "preferences", icon: "🔧" },
        { name: "Security", page: "security", icon: "🔒" }
      ]
    },
  ];

  const quickActions = [
    { name: "Add New Personnel", action: "create", icon: "👤", color: "btn-primary" },
    { name: "Generate Report", action: "report", icon: "📈", color: "btn-secondary" },
    { name: "Export Data", action: "export", icon: "📤", color: "btn-accent" }
  ];

  const handleLinkClick = (name, page) => {
    onNavigate(page);
    onClose(); // Close sidebar on mobile
  };

  const handleThemeChange = (themeKey) => {
    onThemeChange(themeKey);
    setThemeOpen(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setProfileOpen(false);
  };

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

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-80 bg-base-100 shadow-2xl border-r border-base-300
          flex flex-col
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b border-base-300 bg-gradient-to-r ${theme.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="avatar">
                <div className="w-12 rounded-full bg-white/20">
                  <img 
                    src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png" 
                    alt="BLGF Logo"
                    className="p-1"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">BLGF Portal</h2>
                <p className="text-sm text-white/80">Management System</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="btn btn-ghost btn-circle lg:hidden text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4">
          {isLoggedIn ? (
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-center space-x-3">
                  <div className="avatar">
                    <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                      JD
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">John Doe</p>
                    <p className="text-sm text-base-content/70">john.doe@blgf.gov.ph</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-2">
                  <button 
                    onClick={handleLogout}
                    className="btn btn-ghost btn-xs"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={handleLogin}
                className="btn btn-primary btn-block"
              >
                Sign In
              </button>
              <button className="btn btn-ghost btn-block btn-sm">
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <div key={item.page} className="space-y-1">
                <a
                  onClick={() => handleLinkClick(item.name, item.page)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer
                    transition-all duration-200
                    ${currentPage === item.page 
                      ? `bg-primary text-primary-content shadow-lg` 
                      : `hover:bg-base-200 hover:shadow-md`
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </a>

                {/* Sub-items */}
                {item.subItems && currentPage === item.page && (
                  <div className="ml-6 space-y-1">
                    {item.subItems.map((subItem) => (
                      <a
                        key={subItem.page}
                        onClick={() => handleLinkClick(subItem.name, subItem.page)}
                        className={`
                          flex items-center space-x-3 p-2 rounded-lg cursor-pointer
                          transition-all duration-200 text-sm
                          ${currentPage === subItem.page 
                            ? `bg-primary/20 text-primary` 
                            : `hover:bg-base-200`
                          }
                        `}
                      >
                        <span>{subItem.icon}</span>
                        <span>{subItem.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-base-content/70 px-3 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => onNavigate(action.action)}
                  className={`btn ${action.color} btn-sm w-full justify-start`}
                >
                  <span>{action.icon}</span>
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="p-4 border-t border-base-300">
          <div className="dropdown dropdown-top w-full" ref={themeRef}>
            <div tabIndex={0} className="btn btn-ghost w-full justify-between">
              <div className="flex items-center space-x-2">
                <span>{theme.icon}</span>
                <span className="text-sm">{theme.name}</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full mb-2">
              {Object.entries(themes).map(([key, themeData]) => (
                <li key={key}>
                  <a 
                    onClick={() => handleThemeChange(key)}
                    className={`justify-between ${currentTheme === key ? 'active' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{themeData.icon}</span>
                      <span className="text-sm">{themeData.name}</span>
                    </div>
                    {currentTheme === key && <span className="badge badge-primary">✓</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 text-center">
          <p className="text-xs text-base-content/50">
            © 2024 BLGF Portal v1.0.0
          </p>
        </div>
      </div>
    </>
  );
}