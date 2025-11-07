import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router";

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: "Home", path: "/", icon: "🏠", role: null },
    { name: "Directory", path: "/directory", icon: "�", role: null },
    { name: "LGU Profile", path: "/lgu-profile", icon: "🏢", role: null },
    { name: "SMV Profiling", path: "/smv-processes", icon: "📊", role: null },
    { name: "QRRPA Submission", path: "/qrrpa-monitoring", icon: "📋", role: null },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-base-100 border-r border-base-300 flex flex-col fixed left-0 top-0 overflow-y-auto transition-all duration-300`}>
      {/* Logo Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <img
              src="https://blgf.gov.ph/wp-content/uploads/2022/05/BLGF-Seal-HD-768x768.png"
              alt="BLGF"
              className="w-10 h-10 object-cover rounded-full"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm">Bureau of Local</span>
              <span className="font-bold text-sm">Government Finance - REGION XIII</span>
              <span className="text-xs text-base-content/60">DEPARTMENT OF FINANCE</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-2 text-xs text-primary font-semibold">
            BLGF Local - {user?.role || 'User'}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {/* Main Menu Items */}
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive(item.path)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            }`}
            title={isCollapsed ? item.name : ''}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span>{item.name}</span>}
          </button>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-3 border-t border-base-300">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
  );
}
