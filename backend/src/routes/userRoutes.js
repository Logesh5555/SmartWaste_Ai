const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUserStatus,
  getActivityLogs,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id/status', updateUserStatus);
router.get('/activities', getActivityLogs);

module.exports = router;
