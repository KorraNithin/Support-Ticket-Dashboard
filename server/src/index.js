import { openDb } from './db.js';
import { createApp } from './app.js';

const port = process.env.PORT || 4000;
createApp(openDb()).listen(port, () => console.log(`API listening on http://localhost:${port}`));
