const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'erp-ui',
    version: '1.0.0'
  });
});

// Serve static files from dist directory with proper cache control
// Hashed assets (JS/CSS) can be cached long-term since filenames change on content change
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    // index.html should never be cached to ensure fresh deployments are reflected
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Hashed assets from Vite build (contain hash in filename) can be cached long-term
    // Other static assets get moderate caching
    else if (!filePath.match(/\.[a-f0-9]{8}\./)) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for non-hashed assets
    }
    // Hashed assets keep the 1 year maxAge from static options
  }
}));

// Serve index.html for all other routes (SPA routing)
// Use middleware instead of route to avoid path-to-regexp v8 wildcard issues
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ERP UI Server running on port ${PORT}`);
});

