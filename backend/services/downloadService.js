const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const publicDir = path.join(__dirname, '../public');
const thumbnailsDir = path.join(publicDir, 'thumbnails');

// Store active downloads
const downloads = new Map();

class DownloadService {
  constructor() {
    this.downloads = downloads;
  }

  // Get formats for a video URL
  async getFormats(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--extractor-args', 'youtube:player_client=android,web', // Matches Python config
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
        tbr: fmt.tbr
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
    // Video only: by resolution then bitrate
    formatsByType.video_only.sort((a, b) => {
        // Parse resolution (e.g. "1920x1080")
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
        upload_date: info.upload_date
      },
      formats: formatsByType
    };
  }

  // Start a download
  startDownload(url, formatId, saveDir = 'Not Watched') {
    const downloadId = uuidv4();
    
    // Create status object
    this.downloads.set(downloadId, {
      id: downloadId,
      status: 'starting',
      progress: 0,
      speed: '0',
      eta: '0',
      filename: null,
      error: null,
      saveDir
    });

    const outputDir = path.join(publicDir, saveDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');

    const args = [
      '-f', formatId,
      '-o', outputTemplate,
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android,web',
      '--newline', // Important for parsing progress
      url
    ];
    
    // Add ffmpeg post-processing if merging
    if (formatId.includes('+')) {
       args.push('--merge-output-format', 'mp4');
    }

    const process = spawn('yt-dlp', args);

    // Track state
    const status = this.downloads.get(downloadId);

    process.stdout.on('data', (data) => {
      const line = data.toString();
      
      // Parse progress: [download]  45.0% of 10.00MiB at 2.50MiB/s ETA 00:10
      if (line.includes('[download]')) {
        const percentMatch = line.match(/(\d+\.\d+)%/);
        const speedMatch = line.match(/at\s+([^\s]+)/);
        const etaMatch = line.match(/ETA\s+([^\s]+)/);

        if (percentMatch) status.progress = parseFloat(percentMatch[1]);
        if (speedMatch) status.speed = speedMatch[1];
        if (etaMatch) status.eta = etaMatch[1];
        
        status.status = 'downloading';
      }
      
      // Capture filename
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
      
      this.downloads.set(downloadId, status); // Update map
    });

    process.stderr.on('data', (data) => {
       const error = data.toString();
       if (!error.includes('WARNING')) { // Ignore warnings
         console.error(`Download Error (${downloadId}):`, error);
         // Don't fail immediately on stderr output as yt-dlp uses it for some info
       }
    });

    process.on('close', (code) => {
      if (code === 0) {
        status.status = 'finished';
        status.progress = 100;
      } else {
        status.status = 'error';
        status.error = `Process exited with code ${code}`;
      }
      this.downloads.set(downloadId, status);
    });

    return downloadId;
  }

  getDownloadStatus(id) {
    return this.downloads.get(id);
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
