import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { readBookings, updateBookingStatus, BOOKING_STATUSES } from '../services/bookingService.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/bookings', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const status = req.query.status ? String(req.query.status).toUpperCase() : '';
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
    let bookings = await readBookings();

    if (status) {
      if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid booking status.' });
      bookings = bookings.filter(booking => booking.status === status);
    }
    if (search) {
      bookings = bookings.filter(booking =>
        String(booking.name || '').toLowerCase().includes(search)
        || String(booking.phone || '').toLowerCase().includes(search)
        || String(booking.id || '').toLowerCase().includes(search));
    }
    bookings.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    const total = bookings.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const items = bookings.slice((page - 1) * limit, page * limit);
    return res.status(200).json({ items, total, page, pages });
  } catch (error) {
    return next(error);
  }
});

const statusSchema = z.object({ status: z.enum(BOOKING_STATUSES) });

router.patch('/bookings/:id/status', async (req, res, next) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid booking status.' });
  try {
    const booking = await updateBookingStatus(req.params.id, parsed.data.status);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    return res.status(200).json({ booking });
  } catch (error) {
    return next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const bookings = await readBookings();
    const counts = Object.fromEntries(BOOKING_STATUSES.map(status => [status, 0]));
    let requestsToday = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const booking of bookings) {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
      if (String(booking.createdAt || '').slice(0, 10) === today) requestsToday++;
    }
    return res.status(200).json({
      total: bookings.length,
      counts,
      countByStatus: counts,
      statusCounts: counts,
      pending: counts.PENDING,
      accepted: counts.ACCEPTED,
      inProgress: counts.IN_PROGRESS,
      completed: counts.COMPLETED,
      cancelled: counts.CANCELLED,
      requestsToday,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
