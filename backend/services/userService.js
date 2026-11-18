import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { getDemoUsers } from '../data/demoUsers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const usersFile = path.join(dataDir, 'users.json');
let storageQueue = Promise.resolve();

export async function ensureUserStorage() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(usersFile, 'utf8');
  } catch {
    await writeFile(usersFile, '[]\n', 'utf8');
  }
}

export async function readUsers() {
  await ensureUserStorage();
  const value = JSON.parse(await readFile(usersFile, 'utf8'));
  return Array.isArray(value) ? value : [];
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
    await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
    return user;
  });
  storageQueue = operation.catch(() => {});
  return operation;
}
