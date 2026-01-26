const fs = require('fs');
const path = require('path');
const { formatFileSize } = require('../utils/format');

const thumbnailsDir = path.join(__dirname, '../public/thumbnails');

// Get video information
exports.getVideoInfo = (filePath) => {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  const nameWithoutExt = path.basename(filePath, ext);
  
  // Get thumbnail
  const thumbnail = this.getThumbnail(nameWithoutExt);
  
  // Generate YouTube-like metadata
  const views = Math.floor(Math.random() * 1000000) + 1000;
  const likes = Math.floor(Math.random() * 10000) + 100;
  const uploadDate = new Date(Date.now() - Math.random() * 31536000000);
  
  // Clean title
  const cleanTitle = this.cleanTitle(nameWithoutExt);
  
  // Get channel info
  const channel = this.getRandomChannel();
  
  // Generate duration
  const duration = this.generateRandomDuration();
  
  return {
    id: name,
    filename: name,
    title: cleanTitle,
    channel: channel.name,
    channelAvatar: this.generateChannelAvatar(channel),
    url: `/videos/${encodeURIComponent(name)}`,
    thumbnail: thumbnail,
    duration: duration,
    views: views.toLocaleString(),
    likes: likes.toLocaleString(),
    uploadDate: this.formatUploadDate(uploadDate),
    size: formatFileSize(stats.size),
    type: ext.replace('.', '').toUpperCase(),
    createdAt: stats.birthtime
  };
};

// Get thumbnail path or generate placeholder
exports.getThumbnail = (nameWithoutExt) => {
  const thumbnailExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const thumbExt of thumbnailExtensions) {
    const thumbPath = path.join(thumbnailsDir, nameWithoutExt + thumbExt);
    if (fs.existsSync(thumbPath)) {
      return `/thumbnails/${encodeURIComponent(nameWithoutExt + thumbExt)}`;
    }
  }
  
  // Generate placeholder if no thumbnail found
  return this.generatePlaceholderThumbnail(nameWithoutExt);
};

// Generate placeholder thumbnail
exports.generatePlaceholderThumbnail = (nameWithoutExt) => {
  const colors = [
    'ff6b6b', '48dbfb', '1dd1a1', 'feca57', 'ff9ff3', '54a0ff', '5f27cd', '00d2d3'
  ];
  
  const hash = nameWithoutExt.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const color = colors[Math.abs(hash) % colors.length];
  return `https://via.placeholder.com/320x180/${color}/ffffff?text=${encodeURIComponent(nameWithoutExt.substring(0, 20))}`;
};

// Clean video title
exports.cleanTitle = (nameWithoutExt) => {
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\.[^/.]+$/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get random channel
exports.getRandomChannel = () => {
  const channels = [
    { name: 'Tech Videos', color: 'ff0000' },
    { name: 'Entertainment Hub', color: '065fd4' },
    { name: 'Learning Channel', color: '00a2ff' },
    { name: 'Funny Clips', color: 'f00' },
    { name: 'Movie Trailers', color: 'ff6b6b' },
    { name: 'Music Videos', color: '1dd1a1' }
  ];
  
  return channels[Math.floor(Math.random() * channels.length)];
};

// Generate channel avatar URL
exports.generateChannelAvatar = (channel) => {
  return `https://ui-avatars.com/api/?name=${channel.name.replace(/ /g, '+')}&background=${channel.color}&color=fff&bold=true`;
};

// Generate random duration
exports.generateRandomDuration = () => {
  const totalSeconds = Math.floor(Math.random() * 1800) + 60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format upload date
exports.formatUploadDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};