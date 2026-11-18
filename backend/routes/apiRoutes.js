import { Router } from 'express';
import { createBooking, getCars, getQuote, getServices, health } from '../controllers/demoController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { readBookings } from '../services/bookingService.js';

const router = Router();

router.get('/health', health);
router.get('/services', getServices);
router.get('/cars', getCars);
router.post('/quote', getQuote);
router.post('/bookings', optionalAuth, createBooking);

router.get('/bookings/mine', requireAuth, async (req, res, next) => {
  try {
    const bookings = await readBookings();
    const mine = bookings
      .filter(booking => booking.userId === req.user.id)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return res.status(200).json({ items: mine });
  } catch (error) {
    return next(error);
  }
});

export default router;
