import React from 'react'
import { Check, X, Image } from 'lucide-react'
import './ThumbnailStatus.css'

const ThumbnailStatus = ({ video, showBadge = true }) => {
  if (!video) return null;

  const hasThumbnail = video.thumbnailExists;

  if (showBadge) {
    return (
      <div className={`thumbnail-badge ${hasThumbnail ? 'has-thumbnail' : 'no-thumbnail'}`}>
        {hasThumbnail ? (
          <>
            <Check size={12} />
            <span>Custom Thumbnail</span>
          </>
        ) : (
          <>
            <X size={12} />
            <span>Default Thumbnail</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="thumbnail-status">
      <div className="thumbnail-status__icon">
        <Image size={16} />
      </div>
      <div className="thumbnail-status__text">
        {hasThumbnail ? 'Custom thumbnail available' : 'Using default thumbnail'}
      </div>
    </div>
  )
}

export default ThumbnailStatus