import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import CreatePage from "./pages/CreatePage";
import Sidebar from "./components/layout/sidebar";
// import SMVProfilingPage from "./pages/SMVProfilingPage";
// import QRRPASubmissionPage from "./pages/QRRPASubmissionPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTheme, setCurrentTheme] = useState("default");

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
      aqua: "aqua"
    };
    
    document.documentElement.setAttribute('data-theme', themes[currentTheme] || 'corporate');
  }, [currentTheme]);

  const handleNavigation = (page) => {
    setCurrentPage(page);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "directory":
        return <DirectoryPage />;
      case "create":
        return <CreatePage />;
      case "smv-profiling":
        return <SMVProfilingPage />;
      case "qrrpa-submission":
        return <QRRPASubmissionPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* DaisyUI CSS CDN */}
      <link href="https://cdnjs.cloudflare.com/ajax/libs/daisyui/4.4.19/full.css" rel="stylesheet" />
      
      {/* Navigation */}
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      /> */}
      
      {/* Main Content */}
      <main className="flex-grow">
        {renderCurrentPage()}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}