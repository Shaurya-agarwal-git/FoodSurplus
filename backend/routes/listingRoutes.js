import express from 'express';
import {
  analyzeImage,
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  claimListing,
  completeListing
} from '../controllers/listingController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/analyze-image', protect, upload.single('image'), analyzeImage);
router.post('/', protect, authorize('donor', 'admin'), createListing);
router.get('/', getListings);
router.get('/:id', getListing);
router.put('/:id', protect, authorize('donor', 'admin'), updateListing);
router.delete('/:id', protect, authorize('donor', 'admin'), deleteListing);
router.post('/:id/claim', protect, authorize('receiver', 'ngo', 'admin'), claimListing);
router.put('/:id/complete', protect, authorize('donor', 'admin'), completeListing);

export default router;
