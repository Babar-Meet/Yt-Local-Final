import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, RefreshCw, AlertTriangle, Undo, Play } from 'lucide-react'
import VideoCard from '../../components/VideoCard/VideoCard'
import './Trash.css'

const Trash = ({ fetchVideos }) => {
  const [trashVideos, setTrashVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEmptying, setIsEmptying] = useState(false)
  const navigate = useNavigate()

  const fetchTrashVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/videos/trash')
      const data = await response.json()
      
      if (data.success) {
        // Process videos with full URLs for thumbnails
        const videosWithUrls = data.videos.map(video => ({
          ...video,
          url: `http://localhost:5000/trash/${encodeURIComponent(video.filename)}`,
          thumbnail: video.thumbnail.startsWith('/') 
            ? `http://localhost:5000${video.thumbnail}`
            : video.thumbnail
        }))
        
        setTrashVideos(videosWithUrls)
      }
    } catch (error) {
      console.error('Error fetching trash videos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrashVideos()
  }, [])

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL videos in trash? This action cannot be undone!')) {
      return
    }

    setIsEmptying(true)
    try {
      const response = await fetch('http://localhost:5000/api/videos/trash/empty', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Trash emptied! ${data.deletedCount} files deleted.`)
        setTrashVideos([])
        if (fetchVideos) fetchVideos()
      } else {
        alert('Failed to empty trash: ' + data.error)
      }
    } catch (error) {
      console.error('Error emptying trash:', error)
      alert('Error emptying trash')
    } finally {
      setIsEmptying(false)
    }
  }

  const handleRestore = async (filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/videos/trash/restore/${encodeURIComponent(filename)}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Video restored successfully!')
        fetchTrashVideos()
        if (fetchVideos) fetchVideos()
      } else {
        alert('Failed to restore video: ' + data.error)
      }
    } catch (error) {
      console.error('Error restoring video:', error)
      alert('Error restoring video')
    }
  }

  if (loading) {
    return (
      <div className="trash-loading">
        <div className="loading-spinner"></div>
        <p>Loading trash videos...</p>
      </div>
    )
  }

  return (
    <div className="trash-page">
      {/* Header with Empty Trash Button */}
      <div className="trash-header">
        <div className="trash-header__info">
          <h1 className="trash-title">
            <Trash2 size={32} />
            Trash Bin
          </h1>
          <div className="trash-stats">
            <span className="trash-count">{trashVideos.length} videos</span>
            <button 
              className="refresh-btn"
              onClick={fetchTrashVideos}
              title="Refresh trash"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        
        <div className="trash-actions">
          <button 
            className="empty-trash-btn"
            onClick={handleEmptyTrash}
            disabled={trashVideos.length === 0 || isEmptying}
          >
            {isEmptying ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Emptying...
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                Empty Trash
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {trashVideos.length > 0 && (
        <div className="trash-warning">
          <AlertTriangle size={20} />
          <div className="warning-content">
            <strong>Videos in trash will be deleted permanently when you empty the trash.</strong>
            <span>Deleted videos are not counted in storage.</span>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="trash-content">
        {trashVideos.length === 0 ? (
          <div className="trash-empty">
            <Trash2 size={64} />
            <h3>Trash is empty</h3>
            <p>Videos you delete will appear here</p>
            <button 
              className="go-home-btn"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </div>
        ) : (
          <>
            <div className="trash-videos-header">
              <h3>Videos in Trash</h3>
              <div className="trash-instructions">
                <span>Click on a video to watch it from trash</span>
                <span>• Right-click for restore options</span>
              </div>
            </div>
            
            <div className="trash-videos-grid">
              {trashVideos.map((video) => (
                <div key={video.id} className="trash-video-item">
                  <div 
                    className="trash-video-thumbnail"
                    onClick={() => window.open(video.url, '_blank')}
                  >
                    <img src={video.thumbnail} alt={video.title} />
                    <div className="thumbnail-overlay">
                      <Play size={24} />
                    </div>
                    <div className="trash-badge">TRASH</div>
                  </div>
                  
                  <div className="trash-video-info">
                    <h4 className="trash-video-title" title={video.title}>
                      {video.title.length > 40 ? video.title.substring(0, 40) + '...' : video.title}
                    </h4>
                    <div className="trash-video-details">
                      <span>{video.size}</span>
                      <span>•</span>
                      <span>{video.type}</span>
                    </div>
                    <div className="trash-video-actions">
                      <button 
                        className="restore-btn"
                        onClick={() => handleRestore(video.filename)}
                        title="Restore to original location"
                      >
                        <Undo size={14} />
                        Restore
                      </button>
                      <span className="delete-date">
                        Deleted: {new Date(video.deletedDate || video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Trash