import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router";

export default function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: "Home", path: "/", icon: "🏠", role: null },
    { name: "Directory", path: "/directory", icon: "📋", role: null },
    { name: "LGU Profile", path: "/lgu-profile", icon: "🏢", role: null },
    { name: "SMV Profiling", path: "/smv-processes", icon: "📊", role: null },
    { name: "QRRPA Submission", path: "/qrrpa-monitoring", icon: "📑", role: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <img
                src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
                alt="BLGF"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className={`flex flex-col min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <span className="font-bold text-xs truncate">Bureau of Local Gov.</span>
              <span className="font-bold text-[10px] text-base-content/70">REGION XIII</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isCollapsed ? 'lg:justify-center' : ''}
                ${isActive(item.path)
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
              title={isCollapsed ? item.name : ''}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={isCollapsed ? 'lg:hidden' : ''}>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="p-3 border-t border-base-300 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-base-200 transition-all"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
