import React, { useRef, useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react'
import { useVideoPlayerSettings } from '../../Context/VideoPlayerSettingsContext'
import './VideoPlayer.css'

const VideoPlayer = ({ video }) => {
  const { settings } = useVideoPlayerSettings()
  
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // Refs for spacebar hold functionality
  const spacebarHoldTimerRef = useRef(null)
  const spacebarPressedRef = useRef(false)
  const originalPlaybackRateRef = useRef(1)
  const isTempSpeedActiveRef = useRef(false)
  const controlsTimeoutRef = useRef(null)
  
  // Animation states
  const [showPlayPauseAnimation, setShowPlayPauseAnimation] = useState(false)
  const [showSkipAnimation, setShowSkipAnimation] = useState(false)
  const [skipDirection, setSkipDirection] = useState(null)
  const [skipAmount, setSkipAmount] = useState(0)
  
  // Animation timeouts
  const animationTimeoutRef = useRef(null)
  const skipAnimationTimeoutRef = useRef(null)

  useEffect(() => {
    const videoElement = videoRef.current
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
    }
    
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('ended', handleEnded)
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('ended', handleEnded)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      if (skipAnimationTimeoutRef.current) clearTimeout(skipAnimationTimeoutRef.current)
    }
  }, [])

  // Keyboard shortcuts with dynamic key bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'
      if (isInput) return

      const key = e.key
      
      // Handle spacebar based on mode
      if (key === ' ' && settings.spacebarMode === 'playpause') {
        e.preventDefault()
        e.stopPropagation()
        
        if (spacebarPressedRef.current) return
        spacebarPressedRef.current = true
        
        if (settings.tempSpeedEnabled) {
          spacebarHoldTimerRef.current = setTimeout(() => {
            if (spacebarPressedRef.current && videoRef.current) {
              activateTempSpeed()
            }
          }, settings.tempSpeedHoldDelay)
        }
        return
      }

      // Map keys to actions
      switch(key.toLowerCase()) {
        case settings.playPauseKey.toLowerCase():
          e.preventDefault()
          togglePlay()
          break
          
        case settings.forwardSkipKey.toLowerCase():
          e.preventDefault()
          handleSkipWithAnimation(settings.forwardSkipAmount, 'forward')
          break
          
        case settings.backwardSkipKey.toLowerCase():
          e.preventDefault()
          handleSkipWithAnimation(settings.backwardSkipAmount, 'backward')
          break
          
        case settings.muteKey.toLowerCase():
          e.preventDefault()
          toggleMute()
          break
          
        case settings.frameBackKey.toLowerCase():
          e.preventDefault()
          if (videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause()
              setIsPlaying(false)
            }
            previousFrame()
          }
          break
          
        case settings.frameForwardKey.toLowerCase():
          e.preventDefault()
          if (videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause()
              setIsPlaying(false)
            }
            nextFrame()
          }
          break
          
        case settings.speedDownKey.toLowerCase():
          e.preventDefault()
          decreasePlaybackRate()
          break
          
        case settings.speedUpKey.toLowerCase():
          e.preventDefault()
          increasePlaybackRate()
          break
          
        case settings.fullscreenKey.toLowerCase():
          e.preventDefault()
          toggleFullscreen()
          break
      }

      // Handle arrow keys
      if (key === settings.leftArrowKey) {
        e.preventDefault()
        handleSkipWithAnimation(settings.leftArrowSkip, 'backward')
      } else if (key === settings.rightArrowKey) {
        e.preventDefault()
        handleSkipWithAnimation(settings.rightArrowSkip, 'forward')
      } else if (key === settings.volumeUpKey) {
        e.preventDefault()
        changeVolume(volume + 0.1)
      } else if (key === settings.volumeDownKey) {
        e.preventDefault()
        changeVolume(volume - 0.1)
      }
    }

    const handleKeyUp = (e) => {
      const key = e.key
      
      if (key === ' ' && settings.spacebarMode === 'playpause') {
        e.preventDefault()
        e.stopPropagation()
        
        if (spacebarHoldTimerRef.current) {
          clearTimeout(spacebarHoldTimerRef.current)
          spacebarHoldTimerRef.current = null
        }
        
        if (isTempSpeedActiveRef.current) {
          deactivateTempSpeed()
        } else if (spacebarPressedRef.current) {
          togglePlay()
        }
        
        spacebarPressedRef.current = false
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    document.addEventListener('keyup', handleKeyUp, { capture: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
      document.removeEventListener('keyup', handleKeyUp, { capture: true })
      
      if (spacebarHoldTimerRef.current) {
        clearTimeout(spacebarHoldTimerRef.current)
      }
    }
  }, [volume, playbackRate, showControls, isFullscreen, isPlaying, settings])

  // Auto-hide controls
  useEffect(() => {
    if (!settings.controlsAutoHide) {
      setShowControls(true)
      return
    }

    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, settings.autoHideDelay)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying, settings.controlsAutoHide, settings.autoHideDelay])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
      
      // Show play/pause animation
      setShowPlayPauseAnimation(true)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = setTimeout(() => {
        setShowPlayPauseAnimation(false)
      }, 600)
    }
  }

  const handleSkipWithAnimation = (seconds, direction) => {
    skip(seconds)
    
    // Show skip animation
    setSkipDirection(direction)
    setSkipAmount(seconds)
    setShowSkipAnimation(true)
    
    if (skipAnimationTimeoutRef.current) clearTimeout(skipAnimationTimeoutRef.current)
    skipAnimationTimeoutRef.current = setTimeout(() => {
      setShowSkipAnimation(false)
    }, 600)
  }

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
    }
  }

  const changeVolume = (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    setIsMuted(clampedVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = clampedVolume
      videoRef.current.muted = clampedVolume === 0
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
      if (!isMuted) {
        setVolume(0)
      } else {
        setVolume(1)
      }
    }
  }

  const toggleFullscreen = () => {
    const elem = videoRef.current.parentElement
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  // Frame-by-frame navigation with dynamic step
  const previousFrame = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - settings.frameStepSeconds)
    }
  }

  const nextFrame = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += settings.frameStepSeconds
    }
  }

  // Playback rate controls with dynamic settings
  const decreasePlaybackRate = () => {
    const newRate = Math.max(settings.minSpeed, playbackRate - settings.normalSpeedIncrement)
    setPlaybackRate(newRate)
    if (videoRef.current && !isTempSpeedActiveRef.current) {
      videoRef.current.playbackRate = newRate
    }
  }

  const increasePlaybackRate = () => {
    const newRate = Math.min(settings.maxSpeed, playbackRate + settings.normalSpeedIncrement)
    setPlaybackRate(newRate)
    if (videoRef.current && !isTempSpeedActiveRef.current) {
      videoRef.current.playbackRate = newRate
    }
  }

  // Temporary speed with dynamic amount
  const activateTempSpeed = () => {
    if (!videoRef.current || !settings.tempSpeedEnabled) return
    
    if (!isTempSpeedActiveRef.current) {
      originalPlaybackRateRef.current = videoRef.current.playbackRate
    }
    
    videoRef.current.playbackRate = settings.tempSpeedAmount
    isTempSpeedActiveRef.current = true
  }

  const deactivateTempSpeed = () => {
    if (!videoRef.current || !isTempSpeedActiveRef.current) return
    
    videoRef.current.playbackRate = originalPlaybackRateRef.current
    isTempSpeedActiveRef.current = false
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    if (!settings.controlsAutoHide) return
    
    setShowControls(true)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, settings.autoHideDelay)
    }
  }

  const handleVideoClick = (e) => {
    // Only toggle play if clicking on video area, not controls
    if (e.target === videoRef.current || e.target.closest('.video-player__element')) {
      togglePlay()
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div 
      className="video-player" 
      onMouseMove={handleMouseMove}
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        className="video-player__element"
        src={`http://localhost:5000${video.url}`}
        onTimeUpdate={handleTimeUpdate}
      />
      
      {/* Play/Pause Animation Overlay */}
      <div className={`animation-overlay play-pause-animation ${showPlayPauseAnimation ? 'active' : ''}`}>
        <div className="animation-icon">
          {isPlaying ? (
            <div className="pause-icon-animation">
              <div className="pause-bar left"></div>
              <div className="pause-bar right"></div>
            </div>
          ) : (
            <div className="play-icon-animation">
              <div className="play-triangle"></div>
            </div>
          )}
        </div>
      </div>

      {/* Skip Animation Overlay */}
      <div className={`animation-overlay skip-animation ${showSkipAnimation ? 'active' : ''} ${skipDirection}`}>
        <div className="skip-animation-content">
          <div className="skip-icon">
            {skipDirection === 'forward' ? <ChevronRight size={36} /> : <ChevronLeft size={36} />}
          </div>
          <div className="skip-time">
            {skipAmount > 0 ? '+' : ''}{skipAmount}s
          </div>
        </div>
      </div>
      
      <div className={`video-player__controls ${showControls ? 'visible' : ''}`}>
        <div className="video-player__progress">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="progress-slider"
            style={{ '--progress': `${progress}%` }}
          />
        </div>

        <div className="video-player__controls-bottom">
          <div className="video-player__left-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            {settings.showSkipButtons && (
              <>
                <button className="control-btn" onClick={() => handleSkipWithAnimation(settings.backwardSkipAmount, 'backward')}>
                  <ChevronLeft size={20} />
                </button>
                
                <button className="control-btn" onClick={() => handleSkipWithAnimation(settings.forwardSkipAmount, 'forward')}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              {settings.showVolumeSlider && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              )}
            </div>

            {settings.showTimeDisplay && (
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}
          </div>

          <div className="video-player__right-controls">
            <button className="control-btn">
              <Settings size={20} />
            </button>
            
            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer