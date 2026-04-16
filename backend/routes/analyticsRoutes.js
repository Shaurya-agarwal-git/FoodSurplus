import express from 'express';
import {
  getImpactStats,
  getTrends,
  getDonorStats,
  getReceiverStats
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/impact', getImpactStats);
router.get('/trends', protect, authorize('admin'), getTrends);
router.get('/donor/:id/stats', protect, getDonorStats);
router.get('/receiver/:id/stats', protect, getReceiverStats);

export default router;
