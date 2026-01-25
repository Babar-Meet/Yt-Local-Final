const { formatFileSize } = require('./utils/format');

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const videosDir = path.join(__dirname, 'public', 'videos');
const thumbnailsDir = path.join(__dirname, 'public', 'thumbnails');

// Ensure directories exist
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// Serve static files
app.use('/videos', express.static(videosDir));
app.use('/thumbnails', express.static(thumbnailsDir));

// Helper function to get video info
const getVideoInfo = (filePath) => {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  const nameWithoutExt = path.basename(filePath, ext);
  
  // Check for thumbnail - look for various image extensions
  const thumbnailExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  let thumbnail = null;
  
  for (const thumbExt of thumbnailExtensions) {
    const thumbPath = path.join(thumbnailsDir, nameWithoutExt + thumbExt);
    if (fs.existsSync(thumbPath)) {
      thumbnail = `/thumbnails/${encodeURIComponent(nameWithoutExt + thumbExt)}`;
      break;
    }
  }
  
  // If no thumbnail found, use random placeholder
  if (!thumbnail) {
    // Use gradient based on filename hash
    const colors = [
      'ff6b6b', '48dbfb', '1dd1a1', 'feca57', 'ff9ff3', '54a0ff', '5f27cd', '00d2d3'
    ];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const color = colors[Math.abs(hash) % colors.length];
    thumbnail = `https://via.placeholder.com/320x180/${color}/ffffff?text=${encodeURIComponent(nameWithoutExt)}`;
  }
  
  // Generate YouTube-like data
  const views = Math.floor(Math.random() * 1000000) + 1000;
  const likes = Math.floor(Math.random() * 10000) + 100;
  const uploadDate = new Date(Date.now() - Math.random() * 31536000000);
  
  // Use filename as title (clean it up)
  const cleanTitle = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\.[^/.]+$/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const channels = [
    { name: 'Tech Videos', color: 'ff0000' },
    { name: 'Entertainment Hub', color: '065fd4' },
    { name: 'Learning Channel', color: '00a2ff' },
    { name: 'Funny Clips', color: 'f00' },
    { name: 'Movie Trailers', color: 'ff6b6b' },
    { name: 'Music Videos', color: '1dd1a1' }
  ];
  
  const channel = channels[Math.floor(Math.random() * channels.length)];
  
  // Generate realistic duration (1-30 minutes)
  const totalSeconds = Math.floor(Math.random() * 1800) + 60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    id: name,
    filename: name,
    title: cleanTitle,
    channel: channel.name,
    channelAvatar: `https://ui-avatars.com/api/?name=${channel.name.replace(/ /g, '+')}&background=${channel.color}&color=fff&bold=true`,
    url: `/videos/${encodeURIComponent(name)}`,
    thumbnail: thumbnail,
    duration: duration,
    views: views.toLocaleString(),
    likes: likes.toLocaleString(),
    uploadDate: uploadDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    size: formatFileSize(stats.size),
    type: ext.replace('.', '').toUpperCase(),
    createdAt: stats.birthtime
  };
};

// API: Get all videos
app.get('/api/videos', (req, res) => {
  try {
    if (!fs.existsSync(videosDir)) {
      return res.json({ 
        success: true, 
        videos: []
      });
    }

    const files = fs.readdirSync(videosDir);
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    
    const videos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return videoExtensions.includes(ext);
      })
      .map(file => {
        const filePath = path.join(videosDir, file);
        return getVideoInfo(filePath);
      });

    res.json({ 
      success: true, 
      videos,
      total: videos.length
    });
    
  } catch (error) {
    console.error('Error reading videos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load videos' 
    });
  }
});

// API: Get video by filename
app.get('/api/video/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(videosDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }
    
    const videoInfo = getVideoInfo(filePath);
    res.json({ success: true, video: videoInfo });
    
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get video' 
    });
  }
});



// Stream video endpoint (for seeking)
app.get('/api/stream/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(videosDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`📁 Videos: ${videosDir}`);
  console.log(`🖼️  Thumbnails: ${thumbnailsDir}`);
});