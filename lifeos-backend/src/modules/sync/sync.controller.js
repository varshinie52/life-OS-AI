const syncService = require('./sync.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const exportData = asyncHandler(async (req, res) => {
  const data = await syncService.exportUserData(req.user._id);
  
  res.setHeader('Content-disposition', 'attachment; filename=lifeos-export.json');
  res.setHeader('Content-type', 'application/json');
  
  res.status(200).send(JSON.stringify(data, null, 2));
});

module.exports = {
  exportData,
};
