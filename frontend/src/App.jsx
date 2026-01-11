import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router";
import { useAuth } from "./contexts/AuthContext.jsx";

import Sidebar from "./components/layout/Sidebar/Sidebar.jsx";
import TopHeader from "./components/layout/TopHeader/TopHeader.jsx";
import HomePage from "./pages/HomePage";
import AssessorsPage from "./pages/AssessorsPage";
import CreatePage from "./pages/CreatePage";
import LGUPage from "./pages/LGUPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
// import Dashboard from "./pages/Dashboard";
// import LGUsPage from "./pages/LGUsPage";
import SMVProcessesPage from "./pages/SMVMonitoringPage.jsx";
import QRRPAMonitoringPage from "./pages/QRRPAMonitoringPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [currentTheme, setCurrentTheme] = useState("synthwave");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page based on URL path
  const getCurrentPage = () => {
    const path = location.pathname;
    switch (path) {
      case "/":
        return "home";
      case "/directory":
        return "directory";
      case "/lgu-profile":
        return "lgu-profile";
      case "/smv-processes":
        return "smv-profiling";
      case "/qrrpa-monitoring":
        return "qrrpa-submission"; // Map monitoring page to submission nav item
      case "/create":
        return "create";
      case "/users":
        return "users";
      case "/settings":
        return "settings";
      case "/profile":
        return "profile";
      default:
        return "home";
    }
  };

  const currentPage = getCurrentPage();

  // Apply DaisyUI theme to document
  useEffect(() => {
    const themes = {
      corporate: "corporate",
      synthwave: "synthwave",
      cyberpunk: "cyberpunk",
      valentine: "valentine",
    };
    document.documentElement.setAttribute(
      "data-theme",
      themes[currentTheme] || "corporate"
    );
  }, [currentTheme]);

  const handleThemeChange = (theme) => setCurrentTheme(theme);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const handleNavigate = (page) => {
    switch (page) {
      case "home":
        navigate("/");
        break;
      case "directory":
        navigate("/directory");
        break;
      case "lgu-profile":
        navigate("/lgu-profile");
        break;
      case "smv-profiling":
        navigate("/smv-processes"); // adjust to your route
        break;
      case "qrrpa-submission":
        navigate("/qrrpa-monitoring"); // adjust
        break;
      case "create":
        navigate("/create");
        break;
      case "users":
        navigate("/users");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        navigate("/");
    }
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-base-200/30">
      {/* DaisyUI CSS CDN */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/daisyui/4.4.19/full.css"
        rel="stylesheet"
      />

      {user && (
        <>
          {/* Sidebar Navigation */}
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Top Header */}
          <TopHeader
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            sidebarCollapsed={sidebarCollapsed}
            onMobileMenuClick={() => setMobileSidebarOpen(true)}
          />
        </>
      )}

      {/* Main Content - Responsive Margins */}
      <main
        className={`
          min-h-screen transition-all duration-300 pt-16
          ${user ? (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''}
          p-4 sm:p-6
        `}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/directory" element={<AssessorsPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/lgu-profile" element={<LGUPage />} />

          {/* Protected Routes */}
          {/* <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lgus"
            element={
              <ProtectedRoute>
                <LGUsPage />
              </ProtectedRoute>
          /> */}
          <Route
            path="/assessors"
            element={
              <ProtectedRoute>
                <AssessorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smv-processes"
            element={
              <ProtectedRoute>
                <SMVProcessesPage />
              </ProtectedRoute>
            }
          />
          {/*<Route
            path="/laoe-monitoring"
            element={
              <ProtectedRoute>
                <LAOEMonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qrrpa-monitoring"
            element={
              <ProtectedRoute>
                <QRRPAMonitoringPage />
              </ProtectedRoute>
            }/> */}
          <Route
            path="/qrrpa-monitoring"
            element={
              <ProtectedRoute>
                <QRRPAMonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
