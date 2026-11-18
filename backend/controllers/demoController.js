import { randomUUID } from 'node:crypto';
import { cities, estimateFor, knownFuels, modelMap, normalizeCar, services } from '../services/catalogService.js';
import { appendBooking, ensureStorage } from '../services/bookingService.js';

export async function health(req, res) {
  await ensureStorage();
  return res.status(200).json({
    status: 'ok',
    service: 'machanix-api',
    timestamp: new Date().toISOString(),
  });
}

export function getServices(req, res) {
  const result = services.map(({ minPrice, maxPrice, ...service }) => ({
    ...service,
    indicativeRange: { min: minPrice, max: maxPrice, currency: 'INR' },
  }));
  return res.status(200).json({
    services: result,
    disclaimer: 'Prices are indicative and may vary by vehicle and service location.',
  });
}

export function getCars(req, res) {
  return res.status(200).json({
    cars: Object.entries(modelMap).map(([make, models]) => ({ make, models })),
    fuelTypes: [...knownFuels],
  });
}

export function getQuote(req, res) {
  const car = normalizeCar(req.body.car);
  const serviceName = String(req.body.serviceName || 'Standard Service').trim();
  const city = String(req.body.city || 'Bhubaneswar').trim();
  if (!car) return res.status(400).json({ error: 'Select a valid car brand, model and fuel type.' });
  if (!cities.includes(city)) return res.status(400).json({ error: 'Please select a supported city.' });
  const quote = estimateFor(car, serviceName);
  if (!quote) return res.status(400).json({ error: 'Please select a service from the catalogue.' });
  return res.status(200).json({
    quoteId: `FNG-${randomUUID().slice(0, 8).toUpperCase()}`,
    city,
    car,
    ...quote,
    createdAt: new Date().toISOString(),
  });
}

export async function createBooking(req, res) {
  const body = req.body;
  const car = normalizeCar(body.car);
  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  const phone = String(body.phone || '').trim();
  const address = String(body.address || '').trim();
  const city = String(body.city || 'Bhubaneswar').trim();
  const bookingDate = String(body.bookingDate || '').trim();
  const serviceName = String(body.serviceName || '').trim();
  const estimate = estimateFor(car, serviceName);
  const errors = {};

  if (!name || name.length < 2 || name.length > 80) errors.name = 'Enter a name between 2 and 80 characters.';
  const digits = phone.replace(/\D/g, '').length;
  if (!/^[+]?[0-9\s()-]{10,18}$/.test(phone) || digits < 10 || digits > 15) errors.phone = 'Enter a valid phone number.';
  if (!address || address.length < 8 || address.length > 240) errors.address = 'Enter an address between 8 and 240 characters.';
  if (!car) errors.car = 'Select a valid car brand, model and fuel type.';
  if (!cities.includes(city)) errors.city = 'Select a supported demo city.';
  if (!estimate) errors.serviceName = 'Select a service from the catalogue.';
  const requestedDate = Date.parse(`${bookingDate}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || Number.isNaN(requestedDate) || bookingDate < new Date().toISOString().slice(0, 10)) {
    errors.bookingDate = 'Choose a valid date today or later.';
  }
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Please correct the booking details.', fields: errors });
  }

  const booking = {
    id: `FNG-${randomUUID().slice(0, 8).toUpperCase()}`,
    name,
    phone,
    address,
    city,
    bookingDate,
    car,
    serviceName,
    estimate: { min: estimate.estimatedMin, max: estimate.estimatedMax, currency: estimate.currency },
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    note: 'Booking request saved for service confirmation.',
  };
  if (req.user) {
    booking.userId = req.user.id;
    booking.userEmail = req.user.email;
  }
  await appendBooking(booking);
  return res.status(201).json({
    bookingId: booking.id,
    status: booking.status,
    message: 'Booking request saved successfully.',
    booking: { id: booking.id, city: booking.city, bookingDate: booking.bookingDate, serviceName: booking.serviceName },
  });
}
