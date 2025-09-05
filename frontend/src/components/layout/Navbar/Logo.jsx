// Sub-components for better organization
import Theme from "../../../contexts/Theme.jsx";

export default function Logo({ isScrolled, theme = "default", onClick }) {
  const themes = Theme();
  const activeTheme = themes[theme] || themes.default;

  return (
    <div className="flex items-center space-x-3">
      <div className="avatar">
        <div
          className="w-10 rounded-full ring-2 ring-offset-2"
          style={{
            boxShadow: activeTheme.shadow,
            border: activeTheme.border,
          }}
        >
          <img
            src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
            alt="BLGF Logo"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold hidden"
            style={{
              backgroundColor: activeTheme.colors.primary,
              color: "#fff",
            }}
          >
            B
          </div>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`btn btn-ghost text-xl font-bold transition-all duration-300 hover:scale-105 ${
          isScrolled ? `text-[${activeTheme.colors.primary}]` : "text-white"
        }`}
        aria-label="Go to homepage"
      >
        <span className="hidden md:inline">BLGF Portal</span>
        <span className="md:hidden">BLGF</span>
      </button>
    </div>
  );
}
