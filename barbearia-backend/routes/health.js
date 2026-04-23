const express = require('express');

const router = express.Router();

/* GET /api/health */
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    versao: '1.0',
    runtime: 'Node.js ' + process.version
  });
});

module.exports = router;