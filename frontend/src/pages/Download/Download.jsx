import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DownloadHeader from '../../components/Header/DownloadHeader'
import DownloadNav from '../../components/DownloadNav/DownloadNav'
import SimpleDownload from '../../components/simpledownload/simpledownload'
import BatchDownload from '../../components/batchdownload/batchdownload'
import PlaylistDownload from '../../components/playlistdownload/playlistdownload'
import QueueVideos from '../../components/queuevideos/queuevideos'
import ProgressPage from '../../components/progresspage/progresspage'
import DownloadSettings from '../../components/downloadsettings/downloadsettings'
import './Download.css'

const Download = () => {
  return (
    <div className="download-page">
      <DownloadHeader />
      <DownloadNav />
      
      <div className="download-content">
        <Routes>
          <Route index element={<Navigate to="/download/simple" replace />} />
          <Route path="simple" element={<SimpleDownload />} />
          <Route path="batch" element={<BatchDownload />} />
          <Route path="playlist" element={<PlaylistDownload />} />
          <Route path="queue" element={<QueueVideos />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<DownloadSettings />} />
        </Routes>
      </div>
    </div>
  )
}

export default Download