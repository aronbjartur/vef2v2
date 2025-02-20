import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // Import fileURLToPath from node:url
import { getDatabase } from './lib/db.client.js';

const app = express();

// Use fileURLToPath to get the __dirname equivalent in ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsPath = path.join(__dirname, 'views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', require('./routes.js').default);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
