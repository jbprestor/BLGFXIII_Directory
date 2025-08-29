import { Routes, Route } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import DirectoryPage from "./pages/DirectoryPage.jsx";
import { Toaster, toast } from "react-hot-toast";

export default function App() {
    return (
        <div>
            {/* Example toast button */}
            <button onClick={() => toast.success("Congrats!")}>Show Toast</button>

            {/* Router */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/directoryPage" element={<DirectoryPage />} />
            </Routes>

            {/* Toast container */}
            <Toaster position="top-right" />
        </div>
    );
};

