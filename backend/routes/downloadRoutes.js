const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');

// Get available directories
router.get('/directories', downloadController.getDirectories);

// Get formats for a video
router.post('/formats', downloadController.getFormats);

// Start a download (simple or merge)
router.post('/start', downloadController.startDownload);

// Get download status
router.get('/status/:id', downloadController.getDownloadStatus);

module.exports = router;
