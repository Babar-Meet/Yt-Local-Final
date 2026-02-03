const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');

// Get available directories
router.get('/directories', downloadController.getDirectories);

// Get formats for a video
router.post('/formats', downloadController.getFormats);

// Get playlist info
router.post('/playlist-info', downloadController.getPlaylistInfo);

// Start a download (simple or merge)
router.post('/start', downloadController.startDownload);

// Get download status
router.get('/status/:id', downloadController.getDownloadStatus);

// Get all downloads (for process tab)
router.get('/all', downloadController.getAllDownloads);

// Cancel a download
router.post('/cancel/:id', downloadController.cancelDownload);

// Settings
router.get('/settings', downloadController.getSettings);
router.post('/settings', downloadController.updateSettings);

module.exports = router;

