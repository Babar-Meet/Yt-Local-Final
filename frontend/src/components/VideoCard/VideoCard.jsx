import React from 'react'
import { Link } from 'react-router-dom'
import { Play, MoreVertical } from 'lucide-react'
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
    filename
  } = video

  // Check if thumbnail is local or external
  const isLocalThumbnail = thumbnail && thumbnail.startsWith('/thumbnails/');
  
  if (compact) {
    return (
      <Link to={`/watch/${id}`} className="video-card video-card--compact">
        <div className="video-card__thumbnail">
          <img 
            src={thumbnail} 
            alt={title} 
            loading="lazy"
            className={isLocalThumbnail ? 'local-thumbnail' : ''}
          />
          {isLocalThumbnail && <div className="thumbnail-badge">🖼️</div>}

          {/* curently we dont want durection to be on thumbnial be if we want we have cocde just un comment it 
          add durection*/}
          {/* <div className="video-card__duration">{duration}</div> */}
          <div className="video-card__overlay">
            <Play size={20} />
          </div>
        </div>
        <div className="video-card__info">
          <h3 className="video-card__title" title={title}>
            {title.length > 60 ? title.substring(0, 60) + '...' : title}
          </h3>
          <div className="video-card__meta">
            <span>{channel}</span>
            <span></span>
            <span>{formatViews(views)} views</span>
            <span></span>
            <span>{uploadDate}</span>
          </div>
          <div className="video-card__file-info">
            <span>{duration}</span>
            <span>  •  </span>
            <span>{size}</span>
            {isLocalThumbnail && <span className="thumbnail-indicator">🖼️ Local Thumbnail</span>}
          </div>
        </div>
        <button className="video-card__menu">
          <MoreVertical size={16} />
        </button>
      </Link>
    )
  }

  return (
    <Link to={`/watch/${id}`} className="video-card">
      <div className="video-card__thumbnail">
        <img 
          src={thumbnail} 
          alt={title} 
          loading="lazy"
          className={isLocalThumbnail ? 'local-thumbnail' : ''}
        />
        {isLocalThumbnail && <div className="thumbnail-badge">🖼️</div>}
                 
       {/* curently we dont want durection to be on thumbnial be if we want we have cocde just un comment it 
       add durection*/}

        {/* <div className="video-card__duration">{duration}</div> */}
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
            <span>  •  </span>
            <span>{uploadDate}</span>
          </div>
          <div className="video-card__file-info">
            <span>{duration}</span>
            <span>  •  </span>
            <span>{size}</span>
            {isLocalThumbnail && <span className="thumbnail-indicator">🖼️</span>}
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