const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Get all videos
router.get('/', videoController.getAllVideos);

// Get video by filename
router.get('/:filename', videoController.getVideo);

// Stream video (for seeking support)
router.get('/stream/:filename', videoController.streamVideo);

module.exports = router;