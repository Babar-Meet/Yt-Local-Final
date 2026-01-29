const fs = require('fs');
const path = require('path');
const { formatFileSize } = require('../utils/format');
const ffmpeg = require('fluent-ffmpeg');

const thumbnailsDir = path.join(__dirname, '../public/thumbnails');

// Get video information
exports.getVideoInfo = (filePath, relativePath) => {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  const nameWithoutExt = path.basename(filePath, ext);
  
  // Get relative path for thumbnail lookup
  const relativeDir = path.dirname(relativePath);
  const thumbnailRelativePath = relativeDir === '.' ? 
    nameWithoutExt : 
    path.join(relativeDir, nameWithoutExt);
  
  // Get thumbnail - pass video file path for frame extraction
  const thumbnail = this.getThumbnail(thumbnailRelativePath, filePath);
  
  // Generate YouTube-like metadata
  const views = Math.floor(Math.random() * 1000000) + 1000;
  const likes = Math.floor(Math.random() * 10000) + 100;
  const uploadDate = new Date(Date.now() - Math.random() * 31536000000);
  
  // Clean title
  const cleanTitle = this.cleanTitle(nameWithoutExt);
  
  // Get channel info based on folder
  const channel = this.getChannelInfo(relativePath);
  
  // Generate duration
  const duration = this.generateRandomDuration();
  
  // Generate tags/categories based on folder structure
  const tags = this.generateTags(relativePath);
  
  return {
    id: relativePath.replace(/\\/g, '/'), // Use forward slashes for URLs
    filename: name,
    title: cleanTitle,
    channel: channel.name,
    channelAvatar: channel.avatar,
    channelId: channel.id,
    url: `/videos/${encodeURIComponent(relativePath.replace(/\\/g, '/'))}`,
    thumbnail: thumbnail,
    duration: duration,
    views: views.toLocaleString(),
    likes: likes.toLocaleString(),
    uploadDate: this.formatUploadDate(uploadDate),
    size: formatFileSize(stats.size),
    type: ext.replace('.', '').toUpperCase(),
    createdAt: stats.birthtime,
    relativePath: relativePath.replace(/\\/g, '/'),
    folder: path.dirname(relativePath).replace(/\\/g, '/'),
    tags: tags,
    category: this.getCategoryFromPath(relativePath)
  };
};

// Get thumbnail path, extract frame from video if not found, or generate placeholder
exports.getThumbnail = (thumbnailRelativePath, videoFilePath) => {
  const thumbnailExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const thumbnailsBaseDir = path.join(__dirname, '../public/thumbnails');
  
  // First, try to find thumbnail in the same relative path
  for (const thumbExt of thumbnailExtensions) {
    const thumbPath = path.join(thumbnailsBaseDir, thumbnailRelativePath + thumbExt);
    if (fs.existsSync(thumbPath)) {
      return `/thumbnails/${encodeURIComponent(thumbnailRelativePath.replace(/\\/g, '/') + thumbExt)}`;
    }
  }
  
  // If not found, try just the filename in root thumbnails folder (backward compatibility)
  const fileName = path.basename(thumbnailRelativePath);
  for (const thumbExt of thumbnailExtensions) {
    const thumbPath = path.join(thumbnailsBaseDir, fileName + thumbExt);
    if (fs.existsSync(thumbPath)) {
      return `/thumbnails/${encodeURIComponent(fileName + thumbExt)}`;
    }
  }
  
  // If thumbnail not found, try to extract a frame from the video
  if (videoFilePath && fs.existsSync(videoFilePath)) {
    const extractedThumbnail = this.extractVideoFrame(videoFilePath, thumbnailRelativePath);
    if (extractedThumbnail) {
      return extractedThumbnail;
    }
  }
  
  // Generate placeholder if no thumbnail found and video frame extraction failed
  return this.generatePlaceholderThumbnail(fileName);
};

// Extract a frame from video and save as thumbnail
exports.extractVideoFrame = (videoFilePath, thumbnailRelativePath) => {
  try {
    const thumbnailsBaseDir = path.join(__dirname, '../public/thumbnails');
    const thumbnailPath = path.join(thumbnailsBaseDir, thumbnailRelativePath + '.jpg');
    const thumbnailDir = path.dirname(thumbnailPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }
    
    // Use a promise to handle async ffmpeg operation
    return new Promise((resolve) => {
      // Try to extract frame at 1 second (or 10% of duration if available)
      ffmpeg(videoFilePath)
        .on('end', () => {
          if (fs.existsSync(thumbnailPath)) {
            const relativeThumbPath = thumbnailPath.replace(thumbnailsBaseDir + path.sep, '').replace(/\\/g, '/');
            resolve(`/thumbnails/${encodeURIComponent(relativeThumbPath)}`);
          } else {
            resolve(null);
          }
        })
        .on('error', (err) => {
          console.error('Error extracting video frame:', err.message);
          resolve(null);
        })
        .screenshots({
          count: 1,
          filename: path.basename(thumbnailRelativePath) + '.jpg',
          folder: thumbnailDir,
          size: '320x180'
        });
    });
  } catch (error) {
    console.error('Error in extractVideoFrame:', error);
    return null;
  }
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

// Get channel info based on folder path
exports.getChannelInfo = (relativePath) => {
  const folderPath = path.dirname(relativePath);
  
  // Map common folder names to channels
  const folderToChannel = {
    '': { name: 'Your Videos', id: 'your-videos', color: '065fd4' },
    'gaming': { name: 'Gaming Channel', id: 'gaming', color: 'ff0000' },
    'music': { name: 'Music Videos', id: 'music', color: '1dd1a1' },
    'movies': { name: 'Movie Trailers', id: 'movies', color: 'ff6b6b' },
    'tutorials': { name: 'Learning Channel', id: 'tutorials', color: '00a2ff' },
    'funny': { name: 'Funny Clips', id: 'funny', color: 'f00' },
    'tech': { name: 'Tech Videos', id: 'tech', color: '48dbfb' }
  };
  
  // Split folder path and look for matches
  const folderParts = folderPath.split(path.sep);
  let channel = folderToChannel[''];
  
  // Check if any folder part matches a channel
  for (const part of folderParts) {
    const lowerPart = part.toLowerCase();
    if (folderToChannel[lowerPart]) {
      channel = folderToChannel[lowerPart];
      break;
    }
  }
  
  // Generate avatar URL
  const avatar = `https://ui-avatars.com/api/?name=${channel.name.replace(/ /g, '+')}&background=${channel.color}&color=fff&bold=true`;
  
  return {
    name: channel.name,
    id: channel.id,
    avatar: avatar,
    color: channel.color
  };
};

// Generate tags based on folder structure and filename
exports.generateTags = (relativePath) => {
  const tags = new Set();
  const fileName = path.basename(relativePath, path.extname(relativePath));
  
  // Add folder names as tags
  const folderParts = path.dirname(relativePath).split(path.sep);
  folderParts.forEach(part => {
    if (part) {
      tags.add(part.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  });
  
  // Add words from filename as tags
  fileName.split(/[-_\.\s]+/).forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWord.length > 2) {
      tags.add(cleanWord);
    }
  });
  
  // Add some random generic tags
  const genericTags = ['video', 'upload', 'content', 'media', 'clip', 'file'];
  genericTags.forEach(tag => tags.add(tag));
  
  return Array.from(tags).slice(0, 10); // Limit to 10 tags
};

// Get category from path
exports.getCategoryFromPath = (relativePath) => {
  const folderPath = path.dirname(relativePath);
  if (!folderPath || folderPath === '.') return 'All Videos';
  
  const folderName = folderPath.split(path.sep)[0];
  return folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/[-_]/g, ' ');
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