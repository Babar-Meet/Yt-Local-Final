import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

const DownloadContext = createContext();

export const useDownload = () => useContext(DownloadContext);

export const DownloadProvider = ({ children }) => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ maxConcurrentPlaylistDownloads: 3 });
  const pollIntervalRef = useRef(null);

  const fetchDownloads = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/all`);
      const data = await res.json();
      if (data.success) {
        setDownloads(data.downloads);
        
        // Check if we need to continue polling
        // Now also checking for 'queued'
        const hasActive = data.downloads.some(d => ['downloading', 'starting', 'queued'].includes(d.status));
        if (!hasActive && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        } else if (hasActive && !pollIntervalRef.current) {
          startPolling();
        }
      }
    } catch (err) {
      console.error('Failed to fetch downloads', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/settings`);
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        return true;
      }
    } catch (err) {
      console.error('Failed to update settings', err);
    }
    return false;
  };

  const startPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(fetchDownloads, 2000);
  };

  const startDownload = async (url, format_id, save_dir, metadata = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format_id, save_dir, metadata })
      });
      const data = await res.json();
      if (data.success) {
        fetchDownloads();
        startPolling();
        return { success: true, downloadId: data.download_id };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const cancelDownload = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/cancel/${id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchDownloads();
      }
      return data.success;
    } catch (err) {
      console.error('Failed to cancel download', err);
      return false;
    }
  };

  useEffect(() => {
    fetchDownloads();
    fetchSettings();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return (
    <DownloadContext.Provider value={{ 
      downloads, 
      startDownload, 
      cancelDownload, 
      fetchDownloads,
      settings,
      updateSettings,
      fetchSettings
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
