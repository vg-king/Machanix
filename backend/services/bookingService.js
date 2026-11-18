import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { kv } from '@vercel/kv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const bookingsFile = path.join(dataDir, 'bookings.json');
let storageQueue = Promise.resolve();
export const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const BOOKINGS_KEY = 'machanix:bookings';
let memoryBookings = null;
const hasKvStorage = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const deployedDataFile = '/tmp/machanix-bookings.json';

export async function ensureStorage() {
  if (hasKvStorage) return;
  await mkdir(dataDir, { recursive: true });
  const target = process.env.VERCEL ? deployedDataFile : bookingsFile;
  try { await readFile(target, 'utf8'); }
  catch { await writeFile(target, '[]\n', 'utf8'); }
}

export async function readBookings() {
  await ensureStorage();
  let value;
  if (hasKvStorage) {
    value = await kv.get(BOOKINGS_KEY);
  } else if (process.env.VERCEL) {
    try { value = JSON.parse(await readFile(deployedDataFile, 'utf8')); }
    catch { value = memoryBookings; }
  } else {
    value = JSON.parse(await readFile(bookingsFile, 'utf8'));
  }
  if (!Array.isArray(value) && memoryBookings) value = memoryBookings;
  if (!Array.isArray(value)) return [];
  const bookings = value.map(booking => ({
    ...booking,
    status: BOOKING_STATUSES.includes(booking.status) ? booking.status : 'PENDING',
  }));
  memoryBookings = bookings;
  return bookings;
}

async function writeBookings(bookings) {
  memoryBookings = bookings;
  if (hasKvStorage) {
    await kv.set(BOOKINGS_KEY, bookings);
    return;
  }
  if (process.env.VERCEL) {
    try {
      await writeFile(deployedDataFile, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
      return;
    } catch {}
  }
  await writeFile(bookingsFile, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
}

export async function appendBooking(booking) {
  const operation = storageQueue.then(async () => {
    const bookings = await readBookings();
    bookings.push({ ...booking, status: BOOKING_STATUSES.includes(booking.status) ? booking.status : 'PENDING' });
    await writeBookings(bookings);
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
    await writeBookings(bookings);
    return booking;
  });
  storageQueue = operation.catch(() => {});
  return operation;
}
