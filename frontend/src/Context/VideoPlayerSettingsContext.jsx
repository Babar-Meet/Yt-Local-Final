import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  // Skip amounts
  forwardSkipAmount: 10,
  backwardSkipAmount: -10,
  leftArrowSkip: -5,
  rightArrowSkip: 5,
  skipUnit: 'seconds', // 'seconds', 'minutes', 'frames'
  
  // Speed settings
  normalSpeedIncrement: 0.25,
  minSpeed: 0.25,
  maxSpeed: 4,
  tempSpeedAmount: 2,
  tempSpeedHoldDelay: 1000,
  tempSpeedEnabled: true,
  
  // Frame navigation
  frameStepSeconds: 1/30,
  
  // Key bindings
  playPauseKey: 'k',
  forwardSkipKey: 'l',
  backwardSkipKey: 'j',
  leftArrowKey: 'ArrowLeft',
  rightArrowKey: 'ArrowRight',
  volumeUpKey: 'ArrowUp',
  volumeDownKey: 'ArrowDown',
  muteKey: 'm',
  frameBackKey: ',',
  frameForwardKey: '.',
  speedDownKey: '[',
  speedUpKey: ']',
  fullscreenKey: 'f',
  spacebarMode: 'playpause',
  
  // UI settings
  showSkipButtons: true,
  showVolumeSlider: true,
  showTimeDisplay: true,
  controlsAutoHide: true,
  autoHideDelay: 3000,
  
  // NEW: Auto-play and loop settings
  autoPlayNext: true,  // Auto play next video when current ends
  loopSingle: false,   // Loop single video
  showPlaylistControls: true, // Show next/previous buttons for playlists
  nextVideoKey: 'n',   // Key to play next video
  prevVideoKey: 'p',   // Key to play previous video
  autoPlayDelay: 0,    // Delay before auto-playing next video (seconds)
};

const VideoPlayerSettingsContext = createContext();

export const useVideoPlayerSettings = () => {
  const context = useContext(VideoPlayerSettingsContext);
  if (!context) {
    throw new Error('useVideoPlayerSettings must be used within VideoPlayerSettingsProvider');
  }
  return context;
};

export const VideoPlayerSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('videoPlayerSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [draftSettings, setDraftSettings] = useState(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update draft when settings change
  useEffect(() => {
    setDraftSettings(settings);
    setHasUnsavedChanges(false);
  }, [settings]);

  const updateDraftSetting = (key, value) => {
    setDraftSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    const newSettings = { ...draftSettings };
    setSettings(newSettings);
    localStorage.setItem('videoPlayerSettings', JSON.stringify(newSettings));
    setHasUnsavedChanges(false);
    return newSettings;
  };

  const resetToDefaults = () => {
    setDraftSettings(defaultSettings);
    setHasUnsavedChanges(true);
  };

  const cancelChanges = () => {
    setDraftSettings(settings);
    setHasUnsavedChanges(false);
  };

  return (
    <VideoPlayerSettingsContext.Provider value={{
      settings,
      draftSettings,
      hasUnsavedChanges,
      updateDraftSetting,
      saveSettings,
      resetToDefaults,
      cancelChanges
    }}>
      {children}
    </VideoPlayerSettingsContext.Provider>
  );
};