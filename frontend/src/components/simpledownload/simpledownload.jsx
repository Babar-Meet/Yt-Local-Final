import React, { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../../config'
import { 
  Download, 
  Search, 
  Link, 
  Folder, 
  Film, 
  Music, 
  Video, 
  Check, 
  AlertCircle,
  Clock,
  Eye,
  User,
  Calendar
} from 'lucide-react'
import './simpledownload.css'

const SimpleDownload = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState(null)
  const [formats, setFormats] = useState(null)
  const [activeTab, setActiveTab] = useState('video_audio') // video_audio, video_only, audio_only
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [directories, setDirectories] = useState(['Not Watched'])
  const [selectedDir, setSelectedDir] = useState('Not Watched')
  const [error, setError] = useState(null)
  
  // Download State
  const [downloadId, setDownloadId] = useState(null)
  const [downloadStatus, setDownloadStatus] = useState(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    fetchDirectories()
    return () => clearInterval(progressIntervalRef.current)
  }, [])

  const fetchDirectories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/directories`)
      const data = await res.json()
      if (data.success) {
        setDirectories(data.directories)
      }
    } catch (err) {
      console.error('Failed to fetch directories', err)
    }
  }

  const handleFetchFormats = async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    setMetadata(null)
    setFormats(null)
    setSelectedFormat(null)
    setDownloadId(null)
    setDownloadStatus(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/download/formats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()

      if (data.success) {
        setMetadata(data.metadata)
        setFormats(data.formats)
        // Auto-select first available tab
        if (data.formats.video_audio.length > 0) setActiveTab('video_audio')
        else if (data.formats.video_only.length > 0) setActiveTab('video_only')
        else setActiveTab('audio_only')
      } else {
        setError(data.error || 'Failed to fetch formats')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedFormat) return
    
    // Check if we need to start a simple download or merge
    // For now, mirroring simple behavior: just download the selected format
    // Use proper start endpoint
    
    setError(null)
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format_id: selectedFormat.format_id,
          save_dir: selectedDir
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDownloadId(data.download_id)
        startProgressTracking(data.download_id)
      } else {
        setError(data.error || 'Failed to start download')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    }
  }

  const startProgressTracking = (id) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    
    progressIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/download/status/${id}`)
        const data = await res.json()
        
        if (data.success) {
          setDownloadStatus(data)
          if (data.status === 'finished' || data.status === 'error') {
            clearInterval(progressIntervalRef.current)
          }
        }
      } catch (err) {
        console.error('Error tracking progress', err)
      }
    }, 1000)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
  }

  return (
    <div className="simple-download-container">
      {/* URL Input */}
      <div className="url-input-container">
        <input
          type="text"
          className="url-input"
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetchFormats()}
        />
        <button 
          className="fetch-btn"
          onClick={handleFetchFormats}
          disabled={loading || !url}
        >
          {loading ? (
            <span className="loading-spinner-small"></span>
          ) : (
            <Search size={20} />
          )}
          Get Formats
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Metadata Display */}
      {metadata && (
        <div className="video-metadata">
          <img src={metadata.thumbnail} alt={metadata.title} className="video-thumb" />
          <div className="video-info">
            <h2 className="video-title">{metadata.title}</h2>
            <div className="video-uploader">
              <User size={14} style={{ display: 'inline', marginRight: 4 }} />
              {metadata.uploader}
            </div>
            <div className="video-stats">
              <div className="stat-item">
                <Eye size={14} />
                {metadata.view_count?.toLocaleString()} views
              </div>
              <div className="stat-item">
                <Clock size={14} />
                {formatDuration(metadata.duration)}
              </div>
              <div className="stat-item">
                <Calendar size={14} />
                {metadata.upload_date}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formats Selection */}
      {formats && (
        <div className="formats-container">
          <div className="format-tabs">
            <button 
              className={`tab-btn ${activeTab === 'video_audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('video_audio')}
            >
              <Video size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Video + Audio
            </button>
            <button 
              className={`tab-btn ${activeTab === 'video_only' ? 'active' : ''}`}
              onClick={() => setActiveTab('video_only')}
            >
              <Film size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Video Only
            </button>
            <button 
              className={`tab-btn ${activeTab === 'audio_only' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio_only')}
            >
              <Music size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Audio Only
            </button>
          </div>

          <div className="formats-list">
            {formats[activeTab]?.map((fmt) => (
              <div 
                key={fmt.format_id}
                className={`format-card ${selectedFormat?.format_id === fmt.format_id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(fmt)}
              >
                <div className="format-res">
                  {fmt.resolution !== 'N/A' ? fmt.resolution : fmt.audio_ext || fmt.ext}
                  {selectedFormat?.format_id === fmt.format_id && <Check size={18} className="format-check" />}
                </div>
                <div className="format-meta">
                  <span className="format-ext">{fmt.ext}</span>
                  <span className="format-size">{formatFileSize(fmt.filesize)}</span>
                </div>
                <div className="format-badges">
                  {fmt.vcodec && <span className="format-badge">{fmt.vcodec}</span>}
                  {fmt.acodec && <span className="format-badge">{fmt.acodec}</span>}
                  {fmt.fps && <span className="format-badge">{fmt.fps}fps</span>}
                </div>
              </div>
            ))}
            {formats[activeTab]?.length === 0 && (
              <div className="no-formats">No formats available for this category</div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      {selectedFormat && (
        <div className="action-bar">
          <div className="dir-selector">
            <Folder size={20} color="#aaa" />
            <select 
              value={selectedDir} 
              onChange={(e) => setSelectedDir(e.target.value)}
              className="dir-select"
            >
              {directories.map(dir => (
                <option key={dir} value={dir}>{dir}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="download-btn"
            onClick={handleDownload}
            disabled={!!downloadId && downloadStatus?.status === 'downloading'}
          >
            <Download size={20} />
            {downloadId ? 'Downloading...' : 'Download'}
          </button>
        </div>
      )}

      {/* Progress Section */}
      {downloadStatus && (
        <div className="progress-container">
          <div className="progress-header">
            <span className="status-text">
              {downloadStatus.status === 'downloading' && 'Downloading...'}
              {downloadStatus.status === 'finished' && 'Download Complete!'}
              {downloadStatus.status === 'error' && 'Error Occurred'}
            </span>
            <span className="percentage">
              {downloadStatus.progress}%
            </span>
          </div>
          
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${downloadStatus.status}`}
              style={{ width: `${downloadStatus.progress || 0}%` }}
            ></div>
          </div>
          
          {downloadStatus.status === 'downloading' && (
            <div className="progress-stats">
              <span>Speed: {downloadStatus.speed}</span>
              <span>ETA: {downloadStatus.eta}</span>
            </div>
          )}
          
          {downloadStatus.error && (
            <div className="error-text">
              {downloadStatus.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SimpleDownload