require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Import routes
const videoRoutes = require('./routes/videoRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure directories exist
const videosDir = path.join(__dirname, 'public', 'videos');
const thumbnailsDir = path.join(__dirname, 'public', 'thumbnails');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// Serve static files
app.use('/videos', express.static(videosDir));
app.use('/thumbnails', express.static(thumbnailsDir));

// Use routes
app.use('/api/videos', videoRoutes);
app.use('/api/health', healthRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`📁 Videos: ${videosDir}`);
  console.log(`🖼️  Thumbnails: ${thumbnailsDir}`);
});