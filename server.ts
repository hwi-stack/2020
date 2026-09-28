import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDefaultStaffList } from './src/data/defaultStaff.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'lottery-db.json');

const DEFAULT_PRIZES = [
  {
    id: 'coffee',
    name: '커피 티백',
    count: 5,
    colorTheme: 'from-amber-500 to-orange-600',
    accentBg: 'bg-amber-100',
  },
  {
    id: 'cosmetics',
    name: '화장품세트',
    count: 20,
    colorTheme: 'from-rose-500 to-pink-600',
    accentBg: 'bg-rose-100',
  },
];

interface AppData {
  staffList: any[];
  winners: any[];
  prizes: any[];
  lastUpdated?: string;
}

function loadData(): AppData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.staffList) && parsed.staffList.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading data file, using defaults', err);
  }

  const initialData: AppData = {
    staffList: getDefaultStaffList(),
    winners: [],
    prizes: DEFAULT_PRIZES,
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial data file', err);
  }

  return initialData;
}

function saveData(data: AppData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data', err);
  }
}

// In-memory cache
let currentData: AppData = loadData();

// GET all shared data
app.get('/api/data', (_req, res) => {
  res.json(currentData);
});

// Update staff list
app.post('/api/staff', (req, res) => {
  if (Array.isArray(req.body.staffList)) {
    currentData.staffList = req.body.staffList;
    saveData(currentData);
    return res.json({ success: true, count: currentData.staffList.length, lastUpdated: currentData.lastUpdated });
  }
  res.status(400).json({ error: 'Invalid staffList array' });
});

// Update winners
app.post('/api/winners', (req, res) => {
  if (Array.isArray(req.body.winners)) {
    currentData.winners = req.body.winners;
    saveData(currentData);
    return res.json({ success: true, count: currentData.winners.length, lastUpdated: currentData.lastUpdated });
  }
  res.status(400).json({ error: 'Invalid winners array' });
});

// Update prizes
app.post('/api/prizes', (req, res) => {
  if (Array.isArray(req.body.prizes)) {
    currentData.prizes = req.body.prizes;
    saveData(currentData);
    return res.json({ success: true, lastUpdated: currentData.lastUpdated });
  }
  res.status(400).json({ error: 'Invalid prizes array' });
});

// Reset to default
app.post('/api/reset-all', (_req, res) => {
  currentData = {
    staffList: getDefaultStaffList(),
    winners: [],
    prizes: DEFAULT_PRIZES,
    lastUpdated: new Date().toISOString(),
  };
  saveData(currentData);
  res.json({ success: true, data: currentData });
});

// Start Express server with Vite middleware in dev
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
