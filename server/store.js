const fs = require('node:fs/promises');
const path = require('node:path');
const { buildSeed } = require('./seed');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await writeState(buildSeed());
  }
}

async function readState() {
  await ensureDataFile();
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.mkdir(dataDir, { recursive: true });
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString()
  };
  const tempPath = `${dbPath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, dbPath);
  return nextState;
}

async function resetState() {
  const seed = buildSeed();
  await writeState(seed);
  return seed;
}

module.exports = { readState, writeState, resetState };
