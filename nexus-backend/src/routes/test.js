const express = require('express');
const router = express.Router();

router.get('/error', (req, res) => {
  throw new Error('Sentry test error!');
});

module.exports = router; 