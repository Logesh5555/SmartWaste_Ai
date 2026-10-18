const express = require('express');
const router = express.Router();
const {
  getAllBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
  getBinHistory,
} = require('../controllers/binController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.get('/', getAllBins);
router.get('/:id', getBinById);
router.get('/:id/history', getBinHistory);

router.post('/', authorize('admin'), createBin);
router.put('/:id', authorize('admin', 'officer'), updateBin);
router.delete('/:id', authorize('admin'), deleteBin);

module.exports = router;
