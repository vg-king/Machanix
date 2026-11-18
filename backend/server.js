import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';

const PORT = Number(process.env.PORT || 3001);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (entryFile === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Machanix API server listening on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
