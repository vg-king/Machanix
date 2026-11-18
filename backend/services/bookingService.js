import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const bookingsFile = path.join(dataDir, 'bookings.json');
let storageQueue = Promise.resolve();
export const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
  try { await readFile(bookingsFile, 'utf8'); }
  catch { await writeFile(bookingsFile, '[]\n', 'utf8'); }
}

export async function readBookings() {
  await ensureStorage();
  const value = JSON.parse(await readFile(bookingsFile, 'utf8'));
  if (!Array.isArray(value)) return [];
  return value.map(booking => ({
    ...booking,
    status: BOOKING_STATUSES.includes(booking.status) ? booking.status : 'PENDING',
  }));
}

export async function appendBooking(booking) {
  const operation = storageQueue.then(async () => {
    const bookings = await readBookings();
    bookings.push({ ...booking, status: BOOKING_STATUSES.includes(booking.status) ? booking.status : 'PENDING' });
    await writeFile(bookingsFile, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
  });
  storageQueue = operation.catch(() => {});
  await operation;
}

export async function updateBookingStatus(id, status) {
  const operation = storageQueue.then(async () => {
    const bookings = await readBookings();
    const booking = bookings.find(item => item.id === id);
    if (!booking) return null;
    booking.status = status;
    await writeFile(bookingsFile, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
    return booking;
  });
  storageQueue = operation.catch(() => {});
  return operation;
}
