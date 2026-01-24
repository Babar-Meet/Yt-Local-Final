import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import Home from './pages/Home/Home'
import Watch from './pages/Watch/Watch'
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/videos')
      const data = await response.json()
      if (data.success) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <Router>
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div className="app__main">
          <Sidebar isOpen={isSidebarOpen} />
          <div className={`app__content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <Routes>
              <Route path="/" element={<Home videos={videos} loading={loading} />} />
              <Route path="/watch/:id" element={<Watch videos={videos} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App