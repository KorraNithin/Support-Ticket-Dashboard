import { openDb } from './db.js';
import { createApp } from './app.js';

const db = openDb();
// Demo deployments on ephemeral disks: re-seed automatically when the table is empty.
if (process.env.SEED_ON_EMPTY === 'true' && db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n === 0) {
  await import('./seed.js');
}

const port = process.env.PORT || 4000;
createApp(db).listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`));