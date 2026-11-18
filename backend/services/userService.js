import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { getDemoUsers } from '../data/demoUsers.js';
import { kv } from '@vercel/kv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const usersFile = path.join(dataDir, 'users.json');
let storageQueue = Promise.resolve();
const USERS_KEY = 'machanix:users';
let memoryUsers = null;
const hasKvStorage = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const deployedUsersFile = '/tmp/machanix-users.json';

export async function ensureUserStorage() {
  if (hasKvStorage) return;
  await mkdir(dataDir, { recursive: true });
  const target = process.env.VERCEL ? deployedUsersFile : usersFile;
  try { await readFile(target, 'utf8'); }
  catch { await writeFile(target, '[]\n', 'utf8'); }
}

export async function readUsers() {
  await ensureUserStorage();
  let value;
  if (hasKvStorage) {
    value = await kv.get(USERS_KEY);
  } else if (process.env.VERCEL) {
    try { value = JSON.parse(await readFile(deployedUsersFile, 'utf8')); }
    catch { value = memoryUsers; }
  } else {
    value = JSON.parse(await readFile(usersFile, 'utf8'));
  }
  if (!Array.isArray(value) && memoryUsers) value = memoryUsers;
  return Array.isArray(value) ? value : [];
}

async function writeUsers(users) {
  memoryUsers = users;
  if (hasKvStorage) {
    await kv.set(USERS_KEY, users);
    return;
  }
  if (process.env.VERCEL) {
    try {
      await writeFile(deployedUsersFile, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
      return;
    } catch {}
  }
  await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

export async function findUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  const demoUsers = await getDemoUsers();
  const demoUser = demoUsers.find(user => user.email.toLowerCase() === normalizedEmail);
  if (demoUser) return demoUser;
  const users = await readUsers();
  return users.find(user => user.email.toLowerCase() === normalizedEmail) || null;
}

export async function createUser({ name, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await findUserByEmail(normalizedEmail)) {
    const error = new Error('Email is already registered.');
    error.status = 409;
    throw error;
  }

  const operation = storageQueue.then(async () => {
    if (await findUserByEmail(normalizedEmail)) {
      const error = new Error('Email is already registered.');
      error.status = 409;
      throw error;
    }
    const users = await readUsers();
    const user = {
      id: randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeUsers(users);
    return user;
  });
  storageQueue = operation.catch(() => {});
  return operation;
}
