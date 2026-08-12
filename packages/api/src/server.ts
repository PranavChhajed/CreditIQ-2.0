import { createApp } from './routes.js';
import { openDb } from './db.js';

const db = openDb('./creditiq.db');
const app = createApp(db);
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(port, () => {
  console.log(`CreditIQ API listening on http://localhost:${port}`);
});
