import express from 'express';
import { getDatabase } from './lib/db.client.js';
import { environment } from './lib/environment.js';
import { logger } from './lib/logger.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  const result = await getDatabase().query('SELECT * FROM categories');
  const categories = result?.rows ?? [];
  console.log(categories);
  res.render('index', { title: 'Forsíða', categories });
});

router.get('/spurningar/:category', async (req, res) => {
  // TEMP EKKI READY FYRIR PRODUCTION
  const title = req.params.category;
  const db = getDatabase();
  const catRes = await db.query('SELECT * FROM categories WHERE id = $1', [title]);
  if (!catRes.rowCount) return res.render('404', { title: 'Síða fannst ekki' });
  const cat = catRes.rows[0];
  const qRes = await db.query('SELECT * FROM questions WHERE category_id = $1', [title]);
  const questions = qRes.rows;
  for (let question of questions) {
    const aRes = await db.query('SELECT * FROM answers WHERE question_id = $1', [question.id]);
    question.answers = aRes.rows;
  }
  res.render('category', { title: cat.name, questions });
});

router.get('/form', async (req, res) => {
  const result = await getDatabase().query('SELECT * FROM categories');
  const categories = result?.rows ?? [];
  res.render('form', { title: 'Búa til spurningu', categories });
});

router.post('/form', async (req, res) => {
  const { name, question, category_id, new_category, correct_answer } = req.body;
  let answers = req.body['answers[]'] || req.body.answers;
  console.log(question);
  
  // Hér þarf að setja upp validation, hvað ef name er tómt? hvað ef það er allt handritið að BEE MOVIE?
  // Hvað ef það er SQL INJECTION? HVAÐ EF ÞAÐ ER EITTHVAÐ ANNAÐ HRÆÐILEGT?!?!?!?!?!
  // TODO VALIDATION OG HUGA AÐ ÖRYGGI
  
  // Ef validation klikkar, senda skilaboð um það á notanda
  
  // Ef allt OK, búa til í gagnagrunn.
  const env = environment(process.env, logger);
  if (!env) process.exit(1);
  const db = getDatabase();
  let finalCategory = category_id;
  if (category_id === 'new') {
    const catInsert = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [new_category]);
    finalCategory = catInsert.rows[0].id;
  }
  const resultQ = await db.query('INSERT INTO questions (category_id, text) VALUES ($1, $2) RETURNING id', [finalCategory, question]);
  const questionId = resultQ.rows[0].id;
  if (!Array.isArray(answers)) answers = [answers];
  const correctIdx = parseInt(correct_answer, 10);
  for (let i = 0; i < answers.length; i++) {
    await db.query('INSERT INTO answers (question_id, text, correct) VALUES ($1, $2, $3)', [
      questionId,
      answers[i],
      (i + 1) === correctIdx,
    ]);
  }
  console.log(resultQ);
  res.render('form-created', { title: 'Spurning skráð' });
});

export default router;