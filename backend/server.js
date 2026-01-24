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

// Path to videos folder
const videosDir = path.join(__dirname, 'public', 'videos');

// Ensure videos directory exists
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
  console.log(`Created videos directory: ${videosDir}`);
}

// Serve static video files
app.use('/videos', express.static(videosDir));

// API: Get all videos with info
app.get('/api/videos', (req, res) => {
  try {
    // Check if videos directory exists
    if (!fs.existsSync(videosDir)) {
      return res.json({ 
        success: true, 
        videos: [],
        message: 'Videos directory does not exist'
      });
    }

    // Read all files in videos directory
    const files = fs.readdirSync(videosDir);
    
    // Filter only video files
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    const videos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return videoExtensions.includes(ext);
      })
      .map(file => {
        const filePath = path.join(videosDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        
        // Generate random view count, likes, etc. for demo
        const views = Math.floor(Math.random() * 1000000) + 1000;
        const likes = Math.floor(Math.random() * 10000) + 100;
        const uploadDate = new Date(Date.now() - Math.random() * 31536000000); // Random date within last year
        
        // Generate dummy titles based on filename
        const filenameWithoutExt = file.replace(/\.[^/.]+$/, "");
        const dummyTitles = [
          `${filenameWithoutExt} - Amazing Video!`,
          `Watch ${filenameWithoutExt} in HD`,
          `${filenameWithoutExt} Tutorial`,
          `Best ${filenameWithoutExt} Compilation`,
          `${filenameWithoutExt} Full HD Quality`
        ];
        
        const dummyChannels = [
          'Tech Videos',
          'Entertainment Hub',
          'Learning Channel',
          'Funny Clips',
          'Movie Trailers',
          'Music Videos'
        ];
        
        return {
          id: file,
          filename: file,
          title: dummyTitles[Math.floor(Math.random() * dummyTitles.length)],
          channel: dummyChannels[Math.floor(Math.random() * dummyChannels.length)],
          channelAvatar: `https://ui-avatars.com/api/?name=${dummyChannels[Math.floor(Math.random() * dummyChannels.length)]}&background=random`,
          url: `/videos/${encodeURIComponent(file)}`,
          thumbnail: `https://picsum.photos/320/180?random=${Math.random()}`, // Random placeholder image
          duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`, // Random duration
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
      });

    res.json({ 
      success: true, 
      videos,
      total: videos.length,
      folderPath: videosDir
    });
    
  } catch (error) {
    console.error('Error reading videos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read videos directory' 
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get server info
app.get('/api/info', (req, res) => {
  try {
    let totalSize = 0;
    let videoCount = 0;
    
    if (fs.existsSync(videosDir)) {
      const files = fs.readdirSync(videosDir);
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
      
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (videoExtensions.includes(ext)) {
          const filePath = path.join(videosDir, file);
          totalSize += fs.statSync(filePath).size;
          videoCount++;
        }
      });
    }
    
    res.json({
      videosFolder: videosDir,
      videoCount,
      totalSize: formatFileSize(totalSize),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stream video with range support (for seeking)
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
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Video Server running on: http://localhost:${PORT}`);
  console.log(`📁 Videos folder: ${videosDir}`);
  console.log(`📺 API Endpoints:`);
  console.log(`   GET /api/videos - List all videos`);
  console.log(`   GET /api/info - Server info`);
  console.log(`   GET /videos/:filename - Stream video`);
  console.log(`\n👉 Add your video files to: ${videosDir}`);
});