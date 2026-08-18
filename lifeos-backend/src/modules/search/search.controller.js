const searchService = require('./search.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const performSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const results = await searchService.globalSearch(req.user._id, q);
  res.status(200).json(new ApiResponse(200, results, 'Search completed'));
});

module.exports = {
  performSearch,
};
