const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const publicDir = path.join(__dirname, '../public');
const thumbnailsDir = path.join(publicDir, 'thumbnails');

// Store active downloads and their processes
const downloads = new Map();
const processes = new Map();

const queue = [];
let activeDownloadsCount = 0;
const settingsPath = path.join(publicDir, 'download_settings.json');

const defaultSettings = {
  maxConcurrentPlaylistDownloads: 3
};

class DownloadService {
  constructor() {
    this.downloads = downloads;
    this.queue = queue;
    this.settings = this.loadSettings();
    this.activeBatchProcesses = 0;
  }

  loadSettings() {
    try {
      if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return { ...defaultSettings };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2));
    this.processQueue(); // Re-trigger if limit increased
    return this.settings;
  }

  // Get formats for a video URL
  async getFormats(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--extractor-args', 'youtube:player_client=android,web',
        url
      ];

      const process = spawn('yt-dlp', args);
      
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const info = JSON.parse(output);
          resolve(this.processFormats(info));
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err.message}`));
        }
      });
    });
  }

  // Get info for all videos in a playlist
  async getPlaylistInfo(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android,web',
        '--flat-playlist',
        url
      ];

      const process = spawn('yt-dlp', args);
      
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp process exited with code ${code}: ${error}`));
          return;
        }

        try {
          // yt-dlp returns one JSON object per line for playlists
          const lines = output.trim().split('\n');
          const videos = lines.map(line => {
            const info = JSON.parse(line);
            return {
              id: info.id,
              title: info.title,
              url: info.url || `https://www.youtube.com/watch?v=${info.id}`,
              thumbnail: info.thumbnail,
              duration: info.duration,
              uploader: info.uploader
            };
          });
          resolve({ videos });
        } catch (err) {
          reject(new Error(`Failed to parse playlist output: ${err.message}`));
        }
      });
    });
  }

  // Process raw formats into structured data
  processFormats(info) {
    const formatsByType = {
      video_only: [],
      audio_only: [],
      video_audio: []
    };

    const formats = info.formats || [];

    formats.forEach(fmt => {
      const formatInfo = {
        format_id: fmt.format_id,
        ext: fmt.ext,
        resolution: fmt.resolution || 'N/A',
        fps: fmt.fps,
        filesize: fmt.filesize || fmt.filesize_approx || 0,
        vcodec: fmt.vcodec !== 'none' ? fmt.vcodec : null,
        acodec: fmt.acodec !== 'none' ? fmt.acodec : null,
        note: fmt.format_note,
        dynamic_range: fmt.dynamic_range,
        video_ext: fmt.video_ext,
        audio_ext: fmt.audio_ext,
        tbr: fmt.tbr,
        language: fmt.language || 'und',
        language_preference: fmt.language_preference,
        is_original: fmt.language_preference === 10 || (info.original_url && !fmt.language) // heuristics
      };

      // Determine type
      const hasVideo = fmt.vcodec && fmt.vcodec !== 'none';
      const hasAudio = fmt.acodec && fmt.acodec !== 'none';

      if (hasVideo && !hasAudio) {
        formatsByType.video_only.push(formatInfo);
      } else if (!hasVideo && hasAudio) {
        formatsByType.audio_only.push(formatInfo);
      } else if (hasVideo && hasAudio) {
        formatsByType.video_audio.push(formatInfo);
      }
    });

    // Sort formats
    formatsByType.video_only.sort((a, b) => {
        const getRes = (res) => {
            if (!res || res === 'N/A') return 0;
            const parts = res.split('x');
            return parseInt(parts[0]) * (parts.length > 1 ? parseInt(parts[1]) : 1);
        };
        const resA = getRes(a.resolution);
        const resB = getRes(b.resolution);
        if (resB !== resA) return resB - resA;
        return (b.tbr || 0) - (a.tbr || 0);
    });

    return {
      metadata: {
        id: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        uploader: info.uploader,
        view_count: info.view_count,
        upload_date: info.upload_date,
        language: info.language,
        original_language: info.language // YouTube often provides this at top level
      },
      formats: formatsByType
    };
  }

  // Start a download
  startDownload(url, formatId, saveDir = 'Not Watched', metadata = {}) {
    const downloadId = uuidv4();
    
    // Create status object
    this.downloads.set(downloadId, {
      id: downloadId,
      status: 'starting',
      progress: 0,
      speed: '0',
      eta: '0',
      filename: metadata.title || null,
      title: metadata.title || null,
      thumbnail: metadata.thumbnail || null,
      batchId: metadata.batchId || null,
      error: null,
      saveDir,
      url,
      timestamp: new Date().toISOString()
    });

    const outputDir = path.join(publicDir, saveDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const targetThumbDir = path.join(thumbnailsDir, saveDir);
    if (!fs.existsSync(targetThumbDir)) {
      fs.mkdirSync(targetThumbDir, { recursive: true });
    }

    const prefix = metadata.index !== undefined ? `${metadata.index.toString().padStart(2, '0')} ` : '';
    const outputTemplate = path.join(outputDir, `${prefix}%(title)s.%(ext)s`);

    const args = [
      '-f', formatId,
      '-o', outputTemplate,
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android,web',
      '--newline',
      '--write-thumbnail',
      '--convert-thumbnails', 'jpg',
      '--output', `thumbnail:${path.join(targetThumbDir, `${prefix}%(title)s`)}`,
      '--retries', '10',
      '--fragment-retries', '10',
      '--socket-timeout', '30',
      '--no-mtime',
      url
    ];

    
    // Add ffmpeg post-processing if merging
    if (formatId.includes('+')) {
       args.push('--merge-output-format', 'mp4');
    }

    // If it's a single download (no batchId), start immediately bypassing queue logic
    // OR if we want order even for singles, we add them with a special priority.
    // User said: "playlist downlad count in setting not effact the simple vidoe downlad".
    
    if (!metadata.batchId) {
      this.downloads.get(downloadId).status = 'starting';
      this.startProcess(downloadId, args);
    } else {
      this.queue.push({ downloadId, args, isBatch: true });
      this.downloads.get(downloadId).status = 'queued';
      this.processQueue();
    }

    return downloadId;
  }

  processQueue() {
    // Basic logic: if active batch processes < limit, start next batch item
    while (this.activeBatchProcesses < this.settings.maxConcurrentPlaylistDownloads && this.queue.length > 0) {
      const idx = this.queue.findIndex(item => item.isBatch);
      if (idx === -1) break;

      const { downloadId, args } = this.queue.splice(idx, 1)[0];
      const status = this.downloads.get(downloadId);
      
      if (status.status === 'cancelled') continue;

      this.activeBatchProcesses++;
      status.status = 'starting';
      this.downloads.set(downloadId, status);
      this.startProcess(downloadId, args, true);
    }
  }

  startProcess(downloadId, args, isBatch = false) {
    const status = this.downloads.get(downloadId);
    const process = spawn('yt-dlp', args);
    processes.set(downloadId, process);

    process.stdout.on('data', (data) => {
      const line = data.toString();
      
      if (line.includes('[download]')) {
        const percentMatch = line.match(/(\d+\.\d+)%/);
        const speedMatch = line.match(/at\s+([^\s]+)/);
        const etaMatch = line.match(/ETA\s+([^\s]+)/);

        if (percentMatch) status.progress = parseFloat(percentMatch[1]);
        if (speedMatch) status.speed = speedMatch[1];
        if (etaMatch) status.eta = etaMatch[1];
        
        status.status = 'downloading';
      }
      
      if (line.includes('[Merger] Merging formats into')) {
          const match = line.match(/"([^"]+)"/);
          if (match) status.filename = path.basename(match[1]);
      } else if (line.includes('[download] Destination:')) {
          status.filename = path.basename(line.split('Destination: ')[1].trim());
      } else if (line.includes('[download]') && line.includes('has already been downloaded')) {
          status.progress = 100;
          status.status = 'finished';
          status.filename = path.basename(line.split('download] ')[1].split(' has')[0].trim());
      }
      
      this.downloads.set(downloadId, status);
    });

    process.stderr.on('data', (data) => {
       const error = data.toString();
       if (!error.includes('WARNING')) {
         console.error(`Download Error (${downloadId}):`, error);
       }
    });

    process.on('close', (code) => {
      processes.delete(downloadId);
      if (code === 0) {
        status.status = 'finished';
        status.progress = 100;
      } else if (status.status !== 'cancelled') {
        status.status = 'error';
        status.error = `Process exited with code ${code}`;
      }
      this.downloads.set(downloadId, status);
      
      if (isBatch) {
        this.activeBatchProcesses--;
        // Small delay to prevent CPU spikes or rate limiting
        setTimeout(() => this.processQueue(), 500);
      }
    });
  }

  cancelDownload(id) {
    const process = processes.get(id);
    if (process) {
      process.kill();
      const status = this.downloads.get(id);
      if (status) {
        status.status = 'cancelled';
        this.downloads.set(id, status);
      }
      processes.delete(id);
      return true;
    }
    return false;
  }

  getDownloadStatus(id) {
    return this.downloads.get(id);
  }

  getAllDownloads() {
    return Array.from(this.downloads.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getDirectories() {
    try {
      if (!fs.existsSync(publicDir)) return ['Not Watched'];
      
      const items = fs.readdirSync(publicDir, { withFileTypes: true });
      const dirs = items
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'thumbnails' && dirent.name !== 'trash')
        .map(dirent => dirent.name);
      
      if (!dirs.includes('Not Watched')) dirs.push('Not Watched');
      
      return dirs.sort();
    } catch (error) {
      console.error('Error getting directories:', error);
      return ['Not Watched'];
    }
  }
}

module.exports = new DownloadService();

