import React from 'react'
import { Link } from 'react-router-dom'
import { Play, MoreVertical, Folder } from 'lucide-react'
import './VideoCard.css'
import { formatViews } from '../../utils/format'

const VideoCard = ({ video, compact = false }) => {
  const {
    id,
    title,
    channel,
    channelAvatar,
    thumbnail,
    views,
    duration,
    uploadDate,
    size,
    filename,
    folder,
    category
  } = video

  // Check if thumbnail is local or external
  const isLocalThumbnail = thumbnail && thumbnail.startsWith('/thumbnails/');
  
  if (compact) {
    return (
      <Link to={`/watch/${encodeURIComponent(id)}`} className="video-card video-card--compact">
        <div className="video-card__thumbnail">
          <img 
            src={thumbnail} 
            alt={title} 
            loading="lazy"
            className={isLocalThumbnail ? 'local-thumbnail' : ''}
          />
          {isLocalThumbnail && <div className="thumbnail-badge">🖼️</div>}
          
          <div className="video-card__overlay">
            <Play size={20} />
          </div>
          
          {/* Folder indicator */}
          {folder && (
            // <div className="video-card__folder-badge">
            <div >
              <Folder size={12} />
              <span>{folder.split('/').pop()}</span>
            </div>
          )}
        </div>
        
        <div className="video-card__info">
          <h3 className="video-card__title" title={title}>
            {title.length > 60 ? title.substring(0, 60) + '...' : title}
          </h3>
          
          <div className="video-card__meta">
            <span>{channel}</span>
            <span>•</span>
            <span>{formatViews(views)} views</span>
            {/* <span>•</span> */}
            <span>{uploadDate}</span>
          </div>
          
          <div className="video-card__file-info">
            <span>{duration}</span>
            <span>•</span>
            <span>{size}</span>
            
            {/* Show folder if exists */}
            {folder && (
              <>
                {/* <span>•</span> */}
                <span className="folder-indicator" title={`Folder: ${folder}`}>
                  <Folder size={12} />
                  {folder.split('/').pop()}
                </span>
              </>
            )}
          </div>
        </div>
        
        <button className="video-card__menu">
          <MoreVertical size={16} />
        </button>
      </Link>
    )
  }

  return (
    <Link to={`/watch/${encodeURIComponent(id)}`} className="video-card">
      <div className="video-card__thumbnail">
        <img 
          src={thumbnail} 
          alt={title} 
          loading="lazy"
          className={isLocalThumbnail ? 'local-thumbnail' : ''}
        />
        {isLocalThumbnail && <div className="thumbnail-badge">🖼️</div>}
        
        {/* Folder indicator */}
        {folder && (
          // <div className="video-card__folder-badge">
          <div>
            <Folder size={14} />
            <span>{folder.split('/').pop()}</span>
          </div>
        )}
        
        <div className="video-card__overlay">
          <Play size={30} />
        </div>
      </div>
      
      <div className="video-card__content">
        <img src={channelAvatar} alt={channel} className="video-card__avatar" />
        
        <div className="video-card__details">
          <h3 className="video-card__title" title={title}>
            {title.length > 50 ? title.substring(0, 50) + '...' : title}
          </h3>
          
          <div className="video-card__channel">{channel}</div>
          
          <div className="video-card__stats">
            <span>{formatViews(views)} views</span>
            {/* <span>•</span> */}
            <span>{uploadDate}</span>
          </div>
          
          <div className="video-card__file-info">
            <span>{duration}</span>
            <span>•</span>
            <span>{size}</span>
            
            {/* Show folder if exists */}
            {folder && (
              <>
                <span>•</span>
                <span className="folder-indicator" title={`Folder: ${folder}`}>
                  <Folder size={12} />
                  {folder.split('/').pop()}
                </span>
              </>
            )}
          </div>
        </div>
        
        <button className="video-card__menu">
          <MoreVertical size={18} />
        </button>
      </div>
    </Link>
  )
}

export default VideoCard