// src/components/common/ConfirmToast.js
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export const confirmToast = (message, onConfirm, options = {}) => {
  const {
    confirmText = "Confirm",
    cancelText = "Cancel",
    position = "top-center",
    duration = 8000,
    theme = "light",
    icon = "⚠️", // Default warning icon
    title = "Confirmation Required",
  } = options;

  toast.custom(
    (t) => (
      <ToastContent
        t={t}
        message={message}
        onConfirm={onConfirm}
        confirmText={confirmText}
        cancelText={cancelText}
        theme={theme}
        icon={icon}
        title={title}
        duration={duration}
      />
    ),
    {
      position,
      duration,
      id: `confirm-toast-${Date.now()}`,
    }
  );
};

// Toast Content Component
const ToastContent = ({
  t,
  message,
  onConfirm,
  confirmText,
  cancelText,
  theme,
  icon,
  title,
  duration,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (t.visible) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - t.createdAt;
        const remaining = Math.max(0, duration - elapsed);
        setProgress((remaining / duration) * 100);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [t.visible, t.createdAt, duration]);

  return (
    <div
      className={`
        relative flex flex-col p-5 rounded-xl shadow-xl border
        transform transition-all duration-300 ease-out
        ${
          t.visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }
        ${
          theme === "dark"
            ? "bg-gray-900 border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-800"
        }
      `}
      style={{ maxWidth: "420px", minWidth: "320px" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`text-2xl ${
            theme === "dark" ? "text-yellow-400" : "text-yellow-500"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`
            rounded-full p-1 transition-all hover:scale-110
            ${
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }
          `}
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Message */}
      <p className="mb-5 text-base leading-relaxed">{message}</p>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`
            px-4 py-2.5 rounded-lg font-medium transition-all
            border hover:shadow-sm
            ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white"
                : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
            }
          `}
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm?.();
          }}
          className={`
            px-4 py-2.5 rounded-lg font-medium transition-all
            border border-transparent hover:shadow-sm
            ${
              theme === "dark"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-500 text-white hover:bg-red-600"
            }
          `}
        >
          {confirmText}
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
        <div
          className={`
            h-full transition-all duration-100 ease-linear
            ${theme === "dark" ? "bg-red-500" : "bg-red-400"}
          `}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// DaisyUI Version
export const confirmToastDaisy = (message, onConfirm, options = {}) => {
  const {
    confirmText = "Confirm",
    cancelText = "Cancel",
    position = "top-center",
    duration = 8000,
    type = "warning", // success, error, warning, info
    title = "Confirmation Required",
  } = options;

  // Map type to DaisyUI alert types
  const alertType =
    {
      success: "alert-success",
      error: "alert-error",
      warning: "alert-warning",
      info: "alert-info",
    }[type] || "alert-warning";

  toast.custom(
    (t) => (
      <DaisyToastContent
        t={t}
        message={message}
        onConfirm={onConfirm}
        confirmText={confirmText}
        cancelText={cancelText}
        alertType={alertType}
        title={title}
        duration={duration}
      />
    ),
    {
      position,
      duration,
      id: `confirm-toast-${Date.now()}`,
    }
  );
};

// DaisyUI Toast Content Component
const DaisyToastContent = ({
  t,
  message,
  onConfirm,
  confirmText,
  cancelText,
  alertType,
  title,
  duration,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (t.visible) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - t.createdAt;
        const remaining = Math.max(0, duration - elapsed);
        setProgress((remaining / duration) * 100);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [t.visible, t.createdAt, duration]);

  return (
    <div
      className={`
        relative flex flex-col p-5 rounded-box shadow-lg border border-base-300
        transform transition-all duration-300 ease-out
        ${
          t.visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }
        bg-base-100 text-base-content
      `}
      style={{ maxWidth: "420px", minWidth: "320px" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`text-2xl ${alertType.replace("alert-", "text-")}`}>
          {alertType === "alert-success" && "✅"}
          {alertType === "alert-error" && "❌"}
          {alertType === "alert-warning" && "⚠️"}
          {alertType === "alert-info" && "ℹ️"}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Message */}
      <p className="mb-5 text-base leading-relaxed">{message}</p>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => toast.dismiss(t.id)} className="btn btn-ghost">
          {cancelText}
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm?.();
          }}
          className={`btn ${alertType}`}
        >
          {confirmText}
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-box overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ease-linear ${alertType.replace(
            "alert-",
            "bg-"
          )}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
