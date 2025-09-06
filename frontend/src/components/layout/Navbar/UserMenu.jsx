import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function UserMenu({
  isScrolled,
  profileRef,
  profileOpen,
  setProfileOpen,
  showNotification,
  theme,
}) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    showNotification("You have signed out");
    setProfileOpen(false);
  };

  // Generate avatar initials
  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user.firstName?.[0] || "U";

  return (
    <div className="dropdown dropdown-end" ref={profileRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className={`
    btn btn-ghost btn-circle avatar group relative 
    transition-all duration-300 hover:scale-105 focus:outline-none
    ${isScrolled ? "shadow-sm" : ""}
  `}
        aria-label="User menu"
        aria-expanded={profileOpen}
        style={{
          fontFamily: theme.font, // use theme font
        }}
      >
        <div className="relative">
          <div
            className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
        ring-2 ring-offset-2 transition-all duration-300 shadow-lg
      `}
            style={{
              background: theme.gradient, // gradient from theme
              color: theme.text, // text color from theme
              ringColor: theme.ring, // ring color from theme
              boxShadow: theme.shadow, // shadow from theme
            }}
          >
            {initials.toUpperCase()}
          </div>

          {/* Online indicator */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: theme.success, // theme success color
              borderColor: theme.base, // theme base color
            }}
          ></div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {profileOpen && (
        <ul
          className={`
            menu menu-sm dropdown-content mt-3 z-[50] p-0
            bg-base-100 rounded-xl w-64 
            shadow-2xl border border-base-300
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
          style={{
            border: theme?.border || "1px solid hsl(var(--bc) / 0.1)",
            boxShadow: theme?.shadow || "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
          role="menu"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 bg-base-200/50 rounded-t-xl border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-focus text-primary-content flex items-center justify-center font-bold text-xs">
                {initials.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-base-content truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-base-content/60 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <li>
              <button
                onClick={() => {
                  showNotification("Opening profile...");
                  setProfileOpen(false);
                }}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors duration-200 w-full text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Profile</div>
                  <div className="text-xs text-base-content/60">
                    View and edit profile
                  </div>
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  showNotification("Opening settings...");
                  setProfileOpen(false);
                }}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors duration-200 w-full text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Settings</div>
                  <div className="text-xs text-base-content/60">
                    Preferences and options
                  </div>
                </div>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  showNotification("Opening help center...");
                  setProfileOpen(false);
                }}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200 transition-colors duration-200 w-full text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Help</div>
                  <div className="text-xs text-base-content/60">
                    Support and documentation
                  </div>
                </div>
              </button>
            </li>
          </div>

          {/* Divider */}
          <div className="mx-2 border-t border-base-300"></div>

          {/* Logout Button */}
          <div className="p-2">
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-colors duration-200 w-full text-left group"
                role="menuitem"
              >
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center group-hover:bg-error/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Sign out</div>
                  <div className="text-xs text-error/60">End your session</div>
                </div>
              </button>
            </li>
          </div>
        </ul>
      )}
    </div>
  );
}
