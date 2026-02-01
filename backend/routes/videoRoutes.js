const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Get all videos with categories
router.get('/', videoController.getAllVideos);

// Get videos by category/folder
router.get('/category/:categoryPath?', videoController.getVideosByCategory);

// Get video by relative path (using * to capture path with slashes)
router.get('/file/:path(*)', videoController.getVideo);

// Stream video (for seeking support) with full path
router.get('/stream/:path(*)', videoController.streamVideo);

// Move video to trash
router.post('/trash/:path(*)', videoController.moveToTrash);

// Permanently delete video
router.delete('/delete/:path(*)', videoController.deletePermanently);

// Get all videos in trash
router.get('/trash', videoController.getTrashVideos);

// Empty trash
router.delete('/trash/empty', videoController.emptyTrash);

// NEW: Get thumbnail generation progress
router.get('/thumbnail-progress', videoController.getThumbnailProgress);

module.exports = router;