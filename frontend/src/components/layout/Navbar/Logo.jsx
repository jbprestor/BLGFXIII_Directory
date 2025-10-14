// Sub-components for better organization
import Theme from "../../../contexts/Theme.jsx";

export default function Logo({ isScrolled, theme = "corporate", onClick }) {
  const themes = Theme();
  const activeTheme = themes[theme] || themes.corporate;

  return (
    <div className="flex items-center space-x-4">
      {/* Enhanced Logo */}
      <div className="avatar">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-offset-2 transition-all duration-300 hover:ring-4"
          style={{
            boxShadow: activeTheme.shadow,
            border: activeTheme.border,
            ringColor: isScrolled ? activeTheme.colors.primary : 'rgba(255,255,255,0.5)',
          }}
        >
          <img
            src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
            alt="Bureau of Local Government Finance - Caraga Logo"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
          <div
            className="w-full h-full rounded-full items-center justify-center font-bold text-2xl hidden"
            style={{
              backgroundColor: activeTheme.colors.primary,
              color: "#fff",
              display: "none",
            }}
          >
            BLGF
          </div>
        </div>
      </div>
      {/* Enhanced Office Name - Responsive */}
      <button
        onClick={onClick}
        className={`btn btn-ghost text-left p-1 lg:p-2 transition-all duration-300 hover:scale-105 ${
          isScrolled ? `text-[${activeTheme.colors.primary}]` : "text-white"
        }`}
        aria-label="Go to homepage"
      >
        <div className="flex flex-col items-start">
          {/* Extra Large Desktop - Full Name */}
          <span className="hidden 2xl:block text-lg font-bold leading-tight">
            Bureau of Local Government Finance
          </span>
          <span className={`hidden 2xl:block text-sm font-medium opacity-90 ${
            isScrolled ? 'text-primary' : 'text-white/90'
          }`}>
            CARAGA Region
          </span>
          
          {/* Large Desktop - Medium */}
          <span className="hidden xl:block 2xl:hidden text-base font-bold leading-tight">
            BLGF - CARAGA
          </span>
          
          {/* Medium Desktop - Short */}
          <span className="hidden lg:block xl:hidden text-sm font-bold">
            BLGF
          </span>
          
          {/* Tablet and Below - Logo Only */}
          <span className="block lg:hidden text-xs font-medium opacity-0">
            ·
          </span>
        </div>
      </button>
    </div>
  );
}
