import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import router from './routes.js'; // Use a static import

const app = express();

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const viewsPath = path.join(_dirname, 'views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', router);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

export default app;
