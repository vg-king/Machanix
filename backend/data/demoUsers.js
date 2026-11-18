import bcrypt from 'bcryptjs';

const accounts = [
  { id: 'demo-admin', name: 'Admin', email: 'admin@machanix.demo', password: 'Admin@123', role: 'ADMIN' },
  { id: 'demo-user', name: 'User', email: 'user@machanix.demo', password: 'User@123', role: 'USER' },
];

let demoUsersPromise;

export function getDemoUsers() {
  if (!demoUsersPromise) {
    demoUsersPromise = Promise.all(accounts.map(async account => ({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      passwordHash: await bcrypt.hash(account.password, 10),
    })));
  }
  return demoUsersPromise;
}
