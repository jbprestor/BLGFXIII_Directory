import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router";
import { useAuth } from "./contexts/AuthContext.jsx";

import Navbar from "./components/layout/Navbar/Navbar.jsx";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import AssessorsPage from "./pages/AssessorsPage";
import CreatePage from "./pages/CreatePage";
// import Dashboard from "./pages/Dashboard";
// import LGUsPage from "./pages/LGUsPage";
import SMVProcessesPage from "./pages/SMVMonitoringPage.jsx";
// import LAOEMonitoringPage from "./pages/LAOEMonitoringPage";
// import QRRPAMonitoringPage from "./pages/QRRPAMonitoringPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [currentTheme, setCurrentTheme] = useState("default");
  const { user, loading } = useAuth();

  // Apply DaisyUI theme to document
  useEffect(() => {
    const themes = {
      default: "corporate",
      emerald: "emerald",
      sunset: "sunset",
      synthwave: "synthwave",
      retro: "retro",
      cyberpunk: "cyberpunk",
      valentine: "valentine",
      aqua: "aqua",
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

  const navigate = useNavigate();

  const handleNavigate = (page) => {
    switch (page) {
      case "home":
        navigate("/");
        break;
      case "directory":
        navigate("/directory");
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
      default:
        navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* DaisyUI CSS CDN */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/daisyui/4.4.19/full.css"
        rel="stylesheet"
      />

      {/* Navigation */}
      <Navbar
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        user={user}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/directory" element={<AssessorsPage />} />
          <Route path="/create" element={<CreatePage />} />

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
            }
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

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
