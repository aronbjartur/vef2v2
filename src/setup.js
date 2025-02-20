import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Database } from './lib/db.client.js';
import { environment } from './lib/environment.js';
import { logger as loggerSingleton } from './lib/logger.js';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';
const INSERT_FILE = './sql/insert.sql';

/**
 * @param {Database} db
 * @param {import('./lib/logger.js').Logger} logger
 * @returns {Promise<boolean>}
 */
async function setupDbFromFiles(db, logger) {
  const dropScript = await readFile(DROP_SCHEMA_FILE);
  const createScript = await readFile(SCHEMA_FILE);
  const insertScript = await readFile(INSERT_FILE);

  if (await db.query(dropScript.toString('utf-8'))) {
    logger.info('schema dropped');
  } else {
    logger.info('schema not dropped, exiting');
    return false;
  }

  if (await db.query(createScript.toString('utf-8'))) {
    logger.info('schema created');
  } else {
    logger.info('schema not created');
    return false;
  }

  if (await db.query(insertScript.toString('utf-8'))) {
    logger.info('data inserted');
  } else {
    logger.info('data not inserted');
    return false;
  }

  return true;
}

async function importJsonData(db, logger) {
  const dataDir = path.join(process.cwd(), 'data');
  const files = await readdir(dataDir);
  for (const file of files) {
    
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(dataDir, file);
    const fileData = await readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);
    if (!Array.isArray(jsonData.questions)) continue;
    const categoryName = jsonData.title.trim().toLowerCase();
    let categoryResult = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [categoryName]
    );
    let categoryId;
    if (categoryResult && categoryResult.rows.length > 0) {
      categoryId = categoryResult.rows[0].id;
    } else {
      const existing = await db.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
      if (existing && existing.rows.length > 0) {
        categoryId = existing.rows[0].id;
      } else continue;
    }
    for (const questionObj of jsonData.questions) {
      if (
        !questionObj.question ||
        typeof questionObj.question !== 'string' ||
        questionObj.question.trim().length === 0 ||
        !Array.isArray(questionObj.answers) ||
        questionObj.answers.length < 2
      ) {
        continue;
      }
      const questionText = questionObj.question.trim();
      const questionResult = await db.query(
        'INSERT INTO questions (category_id, text) VALUES ($1, $2) RETURNING id',
        [categoryId, questionText]
      );
      if (!questionResult || questionResult.rows.length === 0) continue;
      const questionId = questionResult.rows[0].id;
      for (const answerObj of questionObj.answers) {
        if (!answerObj.answer || typeof answerObj.answer !== 'string' || typeof answerObj.correct !== 'boolean') continue;
        const answerText = answerObj.answer.trim();
        await db.query(
          'INSERT INTO answers (question_id, text, correct) VALUES ($1, $2, $3)',
          [questionId, answerText, answerObj.correct]
        );
      }
    }
  }
  logger.info("JSON data imported successfully");
}

async function create() {
  const logger = loggerSingleton;
  const env = environment(process.env, logger);
  if (!env) process.exit(1);
  logger.info('starting setup');
  const db = new Database(env.connectionString, logger);
  db.open();
  const resultFromFileSetup = await setupDbFromFiles(db, logger);
  if (!resultFromFileSetup) process.exit(1);
  await importJsonData(db, logger);
  logger.info('setup complete');
  await db.close();
}

create().catch((err) => {
  console.error('error running setup', err);
});