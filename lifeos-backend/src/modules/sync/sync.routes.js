const express = require('express');
const syncController = require('./sync.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/export', syncController.exportData);

module.exports = router;
