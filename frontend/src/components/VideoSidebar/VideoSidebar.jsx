import React from 'react'
import VideoCard from '../VideoCard/VideoCard'
import './VideoSidebar.css'

const VideoSidebar = ({ videos, currentVideoId }) => {
  const filteredVideos = videos.filter(video => video.id !== currentVideoId)

  if (filteredVideos.length === 0) {
    return (
      <div className="video-sidebar__empty">
        <p>No other videos</p>
      </div>
    )
  }

  return (
    <div className="video-sidebar">
      <h3 className="video-sidebar__title">Up Next</h3>
      <div className="video-sidebar__list">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} compact={true} />
        ))}
      </div>
    </div>
  )
}

export default VideoSidebar