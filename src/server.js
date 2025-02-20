import express from 'express';
import path from 'node:path';
import { getDatabase } from './lib/db.client.js';
import router from './routes.js';

const app = express();

const viewsPath = path.join(process.cwd(), 'src', 'views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', router);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

export default app;
