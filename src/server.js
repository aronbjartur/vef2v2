import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase } from './lib/db.client.js';

const app = express();

// Use alternative variable names to avoid duplicate declarations
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const viewsPath = path.join(_dirname, 'views');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', (await import('./routes.js')).default);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
