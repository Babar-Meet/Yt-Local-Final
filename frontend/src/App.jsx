import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import Home from './pages/Home/Home'
import Watch from './pages/Watch/Watch'
import './App.css'

function App() {

const [sidebarSize, setSidebarSize] = useState('large') // large, small, hidden
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/videos')
      const data = await response.json()
      
      if (data.success) {
        // Make sure thumbnails have full URL
        const videosWithFullUrls = data.videos.map(video => ({
          ...video,
          thumbnail: video.thumbnail.startsWith('/') 
            ? `http://localhost:5000${video.thumbnail}`
            : video.thumbnail
        }))
        
        setVideos(videosWithFullUrls)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

const toggleSidebar = () => {
  if (sidebarSize === 'large') setSidebarSize('small')
  else if (sidebarSize === 'small') setSidebarSize('hidden')
  else setSidebarSize('large')
}

  return (
    <Router>
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div className="app__main">
          <Sidebar size={sidebarSize} />
          <div className={`app__content ${sidebarSize === 'large' ? 'sidebar-open' : ''}`}>
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