export default function UserMenu({
  isLoggedIn,
  isScrolled,
  profileRef,
  profileOpen,
  setProfileOpen,
  showNotification,
  handleLogout,
  theme,
}) {
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
  </div>;
}
