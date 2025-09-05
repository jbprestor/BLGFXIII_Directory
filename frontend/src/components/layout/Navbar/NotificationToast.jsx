export default function MobileMenu({ notifications, theme }) {
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
  </div>;
}
