import Theme from "../../contexts/Theme.jsx"; // import the function, not {themes}

const themes = Theme(); // call the function once to get the themes

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
  isScrolled,
  themeRef,
  themeOpen,
  setThemeOpen,
  theme,
}) {
  return (
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
        <span className="text-xl">{themes[currentTheme]?.icon}</span>
      </button>
      {themeOpen && (
        <ul
          className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-64 mt-3 border border-base-300"
          style={{
            boxShadow: theme.shadow,
          }}
          role="menu"
        >
          <li className="menu-title">
            <span className="text-base-content/80 font-semibold">Choose Theme</span>
          </li>
          {Object.entries(themes).map(([key, themeData]) => (
            <li key={key}>
              <button
                onClick={() => onThemeChange(key)}
                className={`justify-between transition-colors duration-300 text-base-content ${
                  currentTheme === key
                    ? "active bg-primary/10 text-primary font-semibold"
                    : "hover:bg-base-200"
                }`}
                role="menuitem"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{themeData.icon}</span>
                  <div>
                    <div className="font-medium text-base-content">{themeData.name}</div>
                    <div
                      className={`w-16 h-2 rounded-full bg-gradient-to-r ${themeData.gradient}`}
                    ></div>
                  </div>
                </div>
                {currentTheme === key && (
                  <span className="badge badge-primary badge-sm">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
