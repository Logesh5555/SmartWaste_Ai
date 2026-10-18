const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  previewRouteOptimization,
  createTask,
  updateTaskStatus,
  reportIssue,
} = require('../controllers/collectionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.get('/tasks', getTasks);
router.get('/tasks/:id', getTaskById);
router.post('/optimize', previewRouteOptimization);

router.post('/tasks', authorize('admin'), createTask);
router.put('/tasks/:id/status', authorize('admin', 'staff'), updateTaskStatus);
router.post('/report-issue', authorize('admin', 'staff', 'officer'), reportIssue);

module.exports = router;
