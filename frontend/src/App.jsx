import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { VideoPlayerSettingsProvider } from "./Context/VideoPlayerSettingsContext";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home/Home";
import Watch from "./pages/Watch/Watch";
import CategoryPage from "./pages/CategoryPage/CategoryPage";
import VideoplayerSettings from "./components/VideoplayerSettings/VideoplayerSettings";
import Trash from "./pages/Trash/Trash";
import "./App.css";

function App() {
  const [sidebarSize, setSidebarSize] = useState("large");
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/videos");
      const data = await response.json();

      if (data.success) {
        // Process videos with full URLs for thumbnails and streaming
        const videosWithFullUrls = data.videos.map((video) => ({
          ...video,
          // For streaming, use the API endpoint with relative path
          url:
            video.url ||
            `/api/videos/stream/${encodeURIComponent(video.relativePath || video.id)}`,
          // For thumbnails, use full URL if they're local
          thumbnail: video.thumbnail.startsWith("/")
            ? `http://localhost:5000${video.thumbnail}`
            : video.thumbnail,
        }));

        setVideos(videosWithFullUrls);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const toggleSidebar = () => {
    if (sidebarSize === "large") setSidebarSize("small");
    else if (sidebarSize === "small") setSidebarSize("hidden");
    else setSidebarSize("large");
  };

  return (
    <VideoPlayerSettingsProvider>
      <Router>
        <div className="app">
          <Header toggleSidebar={toggleSidebar} />
          <div className="app__main">
            <Sidebar
              size={sidebarSize}
              categories={categories}
              videos={videos}
            />
            <div
              className={`app__content ${sidebarSize === "large" ? "sidebar-open" : ""}`}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      videos={videos}
                      categories={categories}
                      loading={loading}
                      fetchVideos={fetchVideos}
                    />
                  }
                />
                <Route
                  path="/watch/:id"
                  element={<Watch videos={videos} fetchVideos={fetchVideos} />}
                />
                <Route
                  path="/VideoplayerSettings"
                  element={<VideoplayerSettings />}
                />
                <Route
                  path="/category/:categoryPath?"
                  element={
                    <CategoryPage
                      videos={videos}
                      categories={categories}
                      fetchVideos={fetchVideos}
                    />
                  }
                />
                <Route
                  path="/trash"
                  element={<Trash fetchVideos={fetchVideos} />}
                />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </VideoPlayerSettingsProvider>
  );
}

export default App;
