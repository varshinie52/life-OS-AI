const express = require('express');
const searchController = require('./search.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', searchController.performSearch);

module.exports = router;
