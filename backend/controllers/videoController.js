const fs = require('fs');
const path = require('path');
const videoService = require('../services/videoService');

const publicDir = path.join(__dirname, '../public');
const thumbnailsDir = path.join(publicDir, 'thumbnails');
const trashDir = path.join(publicDir, 'trash');

// Supported video extensions
const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];

// Recursive function to find all video files in a directory
function findVideoFiles(dir, basePath = '', results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.join(basePath, file.name);
    
    if (file.isDirectory()) {
      // Recursively search in subdirectories (except thumbnails and trash directories)
      if (!['thumbnails', 'trash'].includes(file.name)) {
        findVideoFiles(fullPath, relativePath, results);
      }
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (videoExtensions.includes(ext)) {
        results.push({
          absolutePath: fullPath,
          relativePath: relativePath,
          filename: file.name,
          extension: ext
        });
      }
    }
  }
  
  return results;
}

// Get all videos from entire public directory (excluding trash)
exports.getAllVideos = async (req, res) => {
  try {
    if (!fs.existsSync(publicDir)) {
      return res.json({ 
        success: true, 
        videos: [],
        categories: [],
        total: 0
      });
    }

    // Find all video files in the public directory (excluding trash)
    const videoFiles = findVideoFiles(publicDir);
    
    // Get video info for each file
    const videos = videoFiles.map(videoFile => {
      return videoService.getVideoInfo(videoFile.absolutePath, videoFile.relativePath);
    });

    // Create categories based on folder structure
    const categories = createCategories(videos);

    res.json({ 
      success: true, 
      videos,
      categories,
      total: videos.length
    });
    
  } catch (error) {
    console.error('Error reading videos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load videos' 
    });
  }
};

// Create categories from folder structure
function createCategories(videos) {
  const categories = new Map();
  
  videos.forEach(video => {
    const pathParts = video.relativePath.split(path.sep);
    const directoryPath = pathParts.slice(0, -1).join(path.sep); // Remove filename
    
    if (directoryPath) {
      // Split by directory to create subcategories
      let currentPath = '';
      pathParts.slice(0, -1).forEach(part => {
        currentPath = currentPath ? path.join(currentPath, part) : part;
        
        if (!categories.has(currentPath)) {
          categories.set(currentPath, {
            name: part,
            path: currentPath,
            displayName: part.replace(/[-_]/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            count: 0,
            thumbnail: null,
            videos: []
          });
        }
        
        const category = categories.get(currentPath);
        category.count++;
        if (!category.thumbnail && video.thumbnail) {
          category.thumbnail = video.thumbnail;
        }
        category.videos.push(video.id);
      });
    }
  });

  // Convert to array and sort by count
  return Array.from(categories.values())
    .map(category => ({
      ...category,
      videos: category.videos.slice(0, 4) // Only keep first 4 videos for preview
    }))
    .sort((a, b) => b.count - a.count);
}

// Get video by relative path
exports.getVideo = async (req, res) => {
  try {
    const relativePath = decodeURIComponent(req.params.path);
    const filePath = path.join(publicDir, relativePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }
    
    const videoInfo = videoService.getVideoInfo(filePath, relativePath);
    res.json({ success: true, video: videoInfo });
    
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get video' 
    });
  }
};

// Stream video with seeking support
exports.streamVideo = async (req, res) => {
  try {
    const relativePath = decodeURIComponent(req.params.path);
    const filePath = path.join(publicDir, relativePath);
    
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
        'Content-Type': this.getContentType(path.extname(filePath)),
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': this.getContentType(path.extname(filePath)),
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
};

// Helper function to get content type
exports.getContentType = (ext) => {
  const contentTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.m4v': 'video/x-m4v'
  };
  
  return contentTypes[ext.toLowerCase()] || 'video/mp4';
};

// Get videos by category/folder
exports.getVideosByCategory = async (req, res) => {
  try {
    const categoryPath = decodeURIComponent(req.params.categoryPath || '');
    
    // Find all video files in the public directory
    const videoFiles = findVideoFiles(publicDir);
    
    // Filter videos by category/folder
    const categoryVideos = videoFiles
      .filter(videoFile => {
        const videoRelativePath = videoFile.relativePath;
        const videoDir = path.dirname(videoRelativePath);
        return videoDir === categoryPath || 
               (categoryPath === '' && videoDir === '') ||
               videoDir.startsWith(categoryPath + path.sep);
      })
      .map(videoFile => {
        return videoService.getVideoInfo(videoFile.absolutePath, videoFile.relativePath);
      });

    // Get category info
    const categoryName = categoryPath.split(path.sep).pop() || 'All Videos';
    const displayName = categoryName.replace(/[-_]/g, ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    res.json({ 
      success: true, 
      category: {
        name: categoryName,
        displayName: displayName,
        path: categoryPath,
        count: categoryVideos.length,
        videos: categoryVideos
      }
    });
    
  } catch (error) {
    console.error('Error getting category videos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load category videos' 
    });
  }
};

// Move video to trash
exports.moveToTrash = async (req, res) => {
  try {
    const relativePath = decodeURIComponent(req.params.path);
    const videoPath = path.join(publicDir, relativePath);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }
    
    // Get video filename and create trash path
    const videoFilename = path.basename(videoPath);
    const trashVideoPath = path.join(trashDir, videoFilename);
    
    // Ensure trash directory exists
    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }
    
    // Move video file to trash
    fs.renameSync(videoPath, trashVideoPath);
    
    // Try to find and move thumbnail if it exists
    const thumbnailExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const nameWithoutExt = path.basename(relativePath, path.extname(relativePath));
    const relativeDir = path.dirname(relativePath);
    const thumbnailRelativePath = relativeDir === '.' ? 
      nameWithoutExt : 
      path.join(relativeDir, nameWithoutExt);
    
    let thumbnailMoved = false;
    
    // First, try to find thumbnail in the same relative path
    for (const thumbExt of thumbnailExtensions) {
      const thumbPath = path.join(thumbnailsDir, thumbnailRelativePath + thumbExt);
      if (fs.existsSync(thumbPath)) {
        const trashThumbPath = path.join(trashDir, `thumbnail_${videoFilename}${thumbExt}`);
        fs.renameSync(thumbPath, trashThumbPath);
        thumbnailMoved = true;
        break;
      }
    }
    
    // If not found, try just the filename in root thumbnails folder
    if (!thumbnailMoved) {
      const fileName = path.basename(thumbnailRelativePath);
      for (const thumbExt of thumbnailExtensions) {
        const thumbPath = path.join(thumbnailsDir, fileName + thumbExt);
        if (fs.existsSync(thumbPath)) {
          const trashThumbPath = path.join(trashDir, `thumbnail_${videoFilename}${thumbExt}`);
          fs.renameSync(thumbPath, trashThumbPath);
          thumbnailMoved = true;
          break;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Video moved to trash successfully',
      thumbnailMoved: thumbnailMoved
    });
    
  } catch (error) {
    console.error('Error moving video to trash:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to move video to trash' 
    });
  }
};

// Permanently delete video
exports.deletePermanently = async (req, res) => {
  try {
    const relativePath = decodeURIComponent(req.params.path);
    const videoPath = path.join(publicDir, relativePath);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }
    
    // Delete video file
    fs.unlinkSync(videoPath);
    
    // Try to find and delete thumbnail if it exists
    const thumbnailExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const nameWithoutExt = path.basename(relativePath, path.extname(relativePath));
    const relativeDir = path.dirname(relativePath);
    const thumbnailRelativePath = relativeDir === '.' ? 
      nameWithoutExt : 
      path.join(relativeDir, nameWithoutExt);
    
    let thumbnailDeleted = false;
    
    // First, try to find thumbnail in the same relative path
    for (const thumbExt of thumbnailExtensions) {
      const thumbPath = path.join(thumbnailsDir, thumbnailRelativePath + thumbExt);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
        thumbnailDeleted = true;
        break;
      }
    }
    
    // If not found, try just the filename in root thumbnails folder
    if (!thumbnailDeleted) {
      const fileName = path.basename(thumbnailRelativePath);
      for (const thumbExt of thumbnailExtensions) {
        const thumbPath = path.join(thumbnailsDir, fileName + thumbExt);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          thumbnailDeleted = true;
          break;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Video deleted permanently',
      thumbnailDeleted: thumbnailDeleted
    });
    
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete video' 
    });
  }
};

// Add these new functions to the existing videoController.js

// Get all videos in trash
exports.getTrashVideos = async (req, res) => {
  try {
    if (!fs.existsSync(trashDir)) {
      return res.json({ 
        success: true, 
        videos: [],
        total: 0
      });
    }

    // Find all video files in the trash directory
    const videoFiles = findVideoFiles(trashDir, '', []); // Pass empty basePath for trash
    
    // Get video info for each file
    const videos = videoFiles.map(videoFile => {
      const info = videoService.getVideoInfo(videoFile.absolutePath, videoFile.relativePath);
      return {
        ...info,
        originalPath: this.getOriginalPathFromTrash(videoFile.filename),
        deletedDate: fs.statSync(videoFile.absolutePath).mtime,
        inTrash: true
      };
    });

    res.json({ 
      success: true, 
      videos,
      total: videos.length
    });
    
  } catch (error) {
    console.error('Error reading trash videos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load trash videos' 
    });
  }
};

// Helper to reconstruct original path from trash filename
exports.getOriginalPathFromTrash = (filename) => {
  // Remove "thumbnail_" prefix if exists
  const cleanName = filename.replace(/^thumbnail_/, '');
  // Try to find original path based on naming pattern
  // You might need to store original path in a separate file when moving to trash
  return cleanName;
};

// Empty trash (delete all files in trash folder)
exports.emptyTrash = async (req, res) => {
  try {
    if (!fs.existsSync(trashDir)) {
      return res.json({ 
        success: true, 
        message: 'Trash is already empty',
        deletedCount: 0
      });
    }

    const files = fs.readdirSync(trashDir);
    let deletedCount = 0;
    let errors = [];

    files.forEach(file => {
      try {
        const filePath = path.join(trashDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting ${file}:`, error);
        errors.push(file);
      }
    });

    res.json({ 
      success: true, 
      message: `Trash emptied successfully. Deleted ${deletedCount} files.`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to empty trash' 
    });
  }
};

// Restore video from trash
exports.restoreFromTrash = async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const trashPath = path.join(trashDir, filename);
    
    if (!fs.existsSync(trashPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found in trash' 
      });
    }

    // Try to restore to original location (you'll need to store original path)
    // For now, restore to public root
    const originalPath = path.join(publicDir, filename);
    
    // Check if file already exists at destination
    if (fs.existsSync(originalPath)) {
      // Add timestamp to avoid conflict
      const timestamp = Date.now();
      const name = path.basename(filename, path.extname(filename));
      const ext = path.extname(filename);
      const newName = `${name}_restored_${timestamp}${ext}`;
      const newPath = path.join(publicDir, newName);
      fs.renameSync(trashPath, newPath);
      
      res.json({ 
        success: true, 
        message: 'File restored with new name to avoid conflict',
        newPath: newName
      });
    } else {
      fs.renameSync(trashPath, originalPath);
      res.json({ 
        success: true, 
        message: 'File restored successfully' 
      });
    }
    
  } catch (error) {
    console.error('Error restoring from trash:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to restore file' 
    });
  }
};