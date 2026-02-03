import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../../config'
import { useDownload } from '../../Context/DownloadContext'
import { 
  Search, 
  List, 
  Settings, 
  Download, 
  CheckCircle2, 
  Clock, 
  X,
  Plus,
  ArrowRight,
  Folder,
  ChevronRight,
  Monitor,
  Video,
  Music,
  Film,
  AlertCircle
} from 'lucide-react'
import './playlistdownload.css'

const PlaylistDownload = () => {
  const [url, setUrl] = useState('')
  const [processingStatus, setProcessingStatus] = useState('idle') // idle, fetching_list, processing_videos, done
  const [playlistVideos, setPlaylistVideos] = useState([])
  const [videoFormatsMap, setVideoFormatsMap] = useState({})
  const [processedCount, setProcessedCount] = useState(0)
  const [error, setError] = useState(null)
  
  const [selectedCommonQuality, setSelectedCommonQuality] = useState(null)
  const [customSelections, setCustomSelections] = useState({}) // videoId -> formatId
  const [activeBatchId, setActiveBatchId] = useState(null)
  
  const [directories, setDirectories] = useState(['Not Watched'])
  const [selectedDir, setSelectedDir] = useState('Not Watched')
  const [newDirName, setNewDirName] = useState('')
  const [showNewDirInput, setShowNewDirInput] = useState(false)
  
  const [modalVideo, setModalVideo] = useState(null) // Video object being configured in modal
  
  const { startDownload, downloads } = useDownload()

  useEffect(() => {
    fetchDirectories()
    
    // Auto-detect if there's an active batch in progress
    if (!activeBatchId) {
      const activeBatch = downloads.find(d => 
        ['downloading', 'starting', 'queued'].includes(d.status) && d.batchId
      );
      if (activeBatch) {
        setActiveBatchId(activeBatch.batchId);
      }
    }
  }, [downloads, activeBatchId])

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

  const handleProcessPlaylist = async () => {
    if (!url) return
    setProcessingStatus('fetching_list')
    setError(null)
    setPlaylistVideos([])
    setVideoFormatsMap({})
    setProcessedCount(0)
    setSelectedCommonQuality(null)
    setCustomSelections({})

    try {
      const res = await fetch(`${API_BASE_URL}/api/download/playlist-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()

      if (data.success) {
        setPlaylistVideos(data.videos)
        setProcessingStatus('processing_videos')
        
        // Process each video to get formats
        // We'll do it in chunks to avoid overwhelming the server
        const CHUNK_SIZE = 3
        let count = 0
        const formatsMap = {}
        
        for (let i = 0; i < data.videos.length; i += CHUNK_SIZE) {
          const chunk = data.videos.slice(i, i + CHUNK_SIZE)
          await Promise.all(chunk.map(async (v) => {
            try {
              const fRes = await fetch(`${API_BASE_URL}/api/download/formats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: v.url })
              })
              const fData = await fRes.json()
              if (fData.success) {
                formatsMap[v.id] = fData
              }
            } catch (err) {
              console.error(`Failed to fetch formats for ${v.id}`, err)
            } finally {
              count++
              setProcessedCount(count)
            }
          }))
          setVideoFormatsMap({ ...formatsMap })
        }
        
        setProcessingStatus('done')
      } else {
        setError(data.error || 'Failed to fetch playlist info')
        setProcessingStatus('idle')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      setProcessingStatus('idle')
    }
  }

  // Calculate common qualities
  const commonQualitiesList = useMemo(() => {
    if (processingStatus !== 'done' || playlistVideos.length === 0) return []
    
    // Get all resolutions available for each video
    const videoResSets = playlistVideos.map(v => {
      const formats = videoFormatsMap[v.id]?.formats?.video_audio || []
      return new Set(formats.map(f => f.resolution).filter(r => r && r !== 'N/A'))
    })

    if (videoResSets.length === 0) return []

    // Intersection of all sets
    const common = Array.from(videoResSets[0]).filter(res => 
      videoResSets.every(set => set.has(res))
    )

    // Sort by resolution (naive approach)
    return common.sort((a, b) => {
      const getVal = (s) => {
        const parts = s.split('x')
        return parseInt(parts[0]) * (parts.length > 1 ? parseInt(parts[1]) : 1)
      }
      return getVal(b) - getVal(a)
    })
  }, [processingStatus, playlistVideos, videoFormatsMap])

  const handleDownloadAll = async () => {
    const finalDir = showNewDirInput && newDirName.trim() ? newDirName.trim() : selectedDir
    const batchId = `playlist_${Date.now()}`
    setActiveBatchId(batchId)
    
    for (const v of playlistVideos) {
      let formatId = customSelections[v.id]
      
      // If no custom selection, try common quality
      if (!formatId && selectedCommonQuality) {
        const formats = videoFormatsMap[v.id]?.formats?.video_audio || []
        const matchingFormat = formats.find(f => f.resolution === selectedCommonQuality)
        if (matchingFormat) {
          formatId = matchingFormat.format_id
        }
      }

      // If still no format, pick best available video_audio as fallback
      if (!formatId) {
        const formats = videoFormatsMap[v.id]?.formats?.video_audio || []
        if (formats.length > 0) {
          formatId = formats[0].format_id
        }
      }

      if (formatId) {
        await startDownload(v.url, formatId, finalDir, {
          title: v.title,
          thumbnail: v.thumbnail,
          batchId: batchId,
          index: playlistVideos.indexOf(v) // Pass index for 00, 01, etc.
        })
      }
    }

    if (showNewDirInput) {
      fetchDirectories()
      setShowNewDirInput(false)
      setNewDirName('')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
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
    <div className="playlist-download-container">
      <div className="url-input-container">
        <input
          type="text"
          className="url-input"
          placeholder="Paste YouTube Playlist URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleProcessPlaylist()}
        />
        <button 
          className="fetch-btn"
          onClick={handleProcessPlaylist}
          disabled={processingStatus !== 'idle' && processingStatus !== 'done' || !url}
        >
          {processingStatus === 'fetching_list' || processingStatus === 'processing_videos' ? (
            <span className="loading-spinner-small"></span>
          ) : (
            <Search size={20} />
          )}
          Process Playlist
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {activeBatchId && (
        <div className="batch-progress-summary">
           <div className="batch-summary-header">
              <h3>Playlist Download Status</h3>
              <a href="/download/progress" className="view-full-queue">View Full Queue <ChevronRight size={14} /></a>
           </div>
           <div className="batch-stats-grid">
              <div className="batch-stat-card">
                 <div className="stat-value">{downloads.filter(d => d.batchId === activeBatchId).length}</div>
                 <div className="stat-label">Total</div>
              </div>
              <div className="batch-stat-card queued">
                 <div className="stat-value">{downloads.filter(d => d.batchId === activeBatchId && d.status === 'queued').length}</div>
                 <div className="stat-label">Queued</div>
              </div>
              <div className="batch-stat-card downloading">
                 <div className="stat-value">{downloads.filter(d => d.batchId === activeBatchId && (d.status === 'downloading' || d.status === 'starting')).length}</div>
                 <div className="stat-label">Active</div>
              </div>
              <div className="batch-stat-card finished">
                 <div className="stat-value">{downloads.filter(d => d.batchId === activeBatchId && d.status === 'finished').length}</div>
                 <div className="stat-label">Success</div>
              </div>
              <div className="batch-stat-card error">
                 <div className="stat-value">{downloads.filter(d => d.batchId === activeBatchId && d.status === 'error').length}</div>
                 <div className="stat-label">Failed</div>
              </div>
           </div>
           
           <div className="active-batch-list">
              {downloads.filter(d => d.batchId === activeBatchId).slice(0, 5).map(dl => (
                 <div key={dl.id} className="batch-mini-item">
                    <img src={dl.thumbnail} alt="" className="mini-thumb" />
                    <div className="mini-info">
                       <div className="mini-title">{dl.title}</div>
                       <div className="mini-progress-row">
                          <div className="mini-bar-bg">
                             <div className={`mini-bar-fill ${dl.status}`} style={{ width: `${dl.progress}%` }}></div>
                          </div>
                          <span className="mini-percent">
                            {dl.status === 'queued' ? 'Queued' : `${dl.progress}%`}
                          </span>
                       </div>
                    </div>
                 </div>
              ))}
              {downloads.filter(d => d.batchId === activeBatchId).length > 5 && (
                 <div className="more-in-queue">And {downloads.filter(d => d.batchId === activeBatchId).length - 5} more videos...</div>
              )}
           </div>
        </div>
      )}

      {playlistVideos.length > 0 && (
        <div className="playlist-info-card">
          <div className="playlist-header">
            <div className="playlist-title">Playlist: {playlistVideos.length} Videos</div>
            <div className="processing-stats">
              {processingStatus === 'processing_videos' ? (
                `Processing formats: ${processedCount} / ${playlistVideos.length}`
              ) : processingStatus === 'done' ? (
                <span style={{ color: '#1dd1a1', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={16} /> All Processed
                </span>
              ) : null}
            </div>
          </div>

          {processingStatus === 'done' && (
            <div className="common-quality-section">
              <div className="section-title">
                <Settings size={18} />
                Option 1: Set Common Quality for All
              </div>
              {commonQualitiesList.length > 0 ? (
                <div className="qualities-grid">
                  {commonQualitiesList.map(res => (
                    <div 
                      key={res} 
                      className={`quality-chip ${selectedCommonQuality === res ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCommonQuality(res)
                        // Clear custom selections if choosing common
                        // setCustomSelections({})
                      }}
                    >
                      {res}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>No common resolutions found across all videos.</div>
              )}
            </div>
          )}

          <div className="video-list-section">
             <div className="section-title">
                <List size={18} />
                Option 2: Individual Custom Downloads
              </div>
            {playlistVideos.map((video) => {
              const formatsData = videoFormatsMap[video.id]
              const isProcessed = !!formatsData
              const hasCustom = !!customSelections[video.id]
              
              return (
                <div key={video.id} className="playlist-video-item">
                  <img src={video.thumbnail} alt={video.title} className="video-mini-thumb" />
                  <div className="video-detail">
                    <div className="video-title-mini" title={video.title}>{video.title}</div>
                    <div className="video-meta-mini">
                      {video.uploader} • {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    {!isProcessed ? (
                      <div className="video-status">
                        <div className="status-spinner"></div>
                        Wait...
                      </div>
                    ) : (
                      <button 
                        className={`custom-download-btn ${hasCustom ? 'has-selection' : ''}`}
                        onClick={() => setModalVideo(video)}
                      >
                        <Settings size={14} />
                        {hasCustom ? 'Custom Set' : 'Custom'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {playlistVideos.length > 0 && processingStatus === 'done' && (
        <div className="action-footer">
          <div className="dir-selector-wrapper">
            <div className="dir-selector" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Folder size={20} color="#aaa" />
                <select 
                  value={selectedDir} 
                  onChange={(e) => setSelectedDir(e.target.value)}
                  className="dir-select"
                  style={{ background: 'none', border: 'none', color: 'white', outline: 'none', cursor: 'pointer' }}
                  disabled={showNewDirInput}
                >
                  {directories.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
                <button 
                  className={`new-dir-toggle ${showNewDirInput ? 'active' : ''}`}
                  onClick={() => setShowNewDirInput(!showNewDirInput)}
                  style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                >
                  <Plus size={18} />
                </button>
            </div>
            
            {showNewDirInput && (
              <div className="new-dir-input-container" style={{ marginTop: 8 }}>
                <input 
                  type="text" 
                  className="new-dir-input" 
                  placeholder="New folder name..."
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  autoFocus
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #3ea6ff', borderRadius: 8, padding: '8px 12px', color: 'white', width: '100%' }}
                />
              </div>
            )}
          </div>

          <button 
            className="download-all-btn"
            onClick={handleDownloadAll}
            disabled={!selectedCommonQuality && Object.keys(customSelections).length === 0 && !confirm('No common quality selected. Download best available for all?')}
          >
            <Download size={20} />
            Download all {playlistVideos.length} Videos
          </button>
        </div>
      )}

      {/* Custom Format Modal */}
      {modalVideo && (
        <div className="overlay" onClick={() => setModalVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={20} />
                Custom Quality: {modalVideo.title.substring(0, 40)}...
              </h3>
              <button className="close-btn" onClick={() => setModalVideo(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {videoFormatsMap[modalVideo.id]?.formats?.video_audio.map(fmt => (
                  <div 
                    key={fmt.format_id}
                    className={`format-card ${customSelections[modalVideo.id] === fmt.format_id ? 'active' : ''}`}
                    onClick={() => {
                        setCustomSelections({...customSelections, [modalVideo.id]: fmt.format_id})
                        setModalVideo(null)
                    }}
                    style={{
                      background: customSelections[modalVideo.id] === fmt.format_id ? 'rgba(62, 166, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: customSelections[modalVideo.id] === fmt.format_id ? '1px solid #3ea6ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{fmt.resolution}</div>
                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{fmt.ext} • {formatFileSize(fmt.filesize)}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 8, background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>
                      {fmt.fps}fps • {fmt.vcodec}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="fetch-btn" 
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                onClick={() => {
                   const { [modalVideo.id]: _, ...rest } = customSelections
                   setCustomSelections(rest)
                   setModalVideo(null)
                }}
              >
                Reset to Default
              </button>
              <button className="fetch-btn" onClick={() => setModalVideo(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistDownload