// Mobile Menu Component (extracted for better organization)
export default function MobileMenu({
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
}) {
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
                <div className="w-10 h-10 bg-white/20 rounded-full items-center justify-center text-white font-bold hidden">
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
}
