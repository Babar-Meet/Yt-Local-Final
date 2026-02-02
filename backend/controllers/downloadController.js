const downloadService = require('../services/downloadService');

exports.getDirectories = (req, res) => {
  try {
    const directories = downloadService.getDirectories();
    res.json({ success: true, directories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFormats = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const data = await downloadService.getFormats(url);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch formats: ' + error.message });
  }
};

exports.startDownload = (req, res) => {
  try {
    const { url, format_id, save_dir } = req.body;
    
    if (!url || !format_id) {
      return res.status(400).json({ success: false, error: 'URL and format_id are required' });
    }

    const downloadId = downloadService.startDownload(url, format_id, save_dir);
    res.json({ success: true, download_id: downloadId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDownloadStatus = (req, res) => {
  try {
    const { id } = req.params;
    const status = downloadService.getDownloadStatus(id);
    
    if (!status) {
      return res.status(404).json({ success: false, error: 'Download not found' });
    }
    
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
