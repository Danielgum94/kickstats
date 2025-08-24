// ====== 1) ייבוא והכנות בסיס ======
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../client/dist');

const app = express();
app.use(cors());          // Dev נפרד? מאפשר בקשות מה-Client
app.use(express.json());  // תמיכה ב-JSON בבקשות POST/PUT

// לוגינג לכל בקשה (עוזר לדיבוג)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


// ====== 2) דאטה דמו בסיסי ======
const teams = [
  { id: 'chelsea',   name: 'Chelsea' },
  { id: 'liverpool', name: 'Liverpool' },
  { id: 'arsenal',   name: 'Arsenal' },
  { id: 'manutd',    name: 'Manchester United' },
];

const matches = [
  { id: 1, date: '2024-03-10', home: 'chelsea',  away: 'liverpool', score: '2-2', competition: 'Premier League' },
  { id: 2, date: '2023-11-04', home: 'liverpool', away: 'chelsea',  score: '1-0', competition: 'Premier League' },
  { id: 3, date: '2023-05-02', home: 'chelsea',  away: 'liverpool', score: '1-2', competition: 'Premier League' },
  { id: 4, date: '2022-09-15', home: 'chelsea',  away: 'arsenal',   score: '3-1', competition: 'Premier League' },
  { id: 5, date: '2022-11-12', home: 'manutd',   away: 'chelsea',   score: '0-0', competition: 'Premier League' },
];


// ====== 3) ניחושים (In-Memory) ======
const predictionsByMatch = new Map();

function upsertPrediction(matchId, clientId, home, away) {
  if (!predictionsByMatch.has(matchId)) predictionsByMatch.set(matchId, new Map());
  predictionsByMatch.get(matchId).set(clientId, {
    home: Number(home),
    away: Number(away),
    at: Date.now(),
  });
}

function aggregatePredictions(matchId) {
  const map = predictionsByMatch.get(matchId);
  if (!map) return { total: 0, homeWins: 0, draws: 0, awayWins: 0, avgHome: 0, avgAway: 0 };

  let total = 0, homeWins = 0, draws = 0, awayWins = 0, sumH = 0, sumA = 0;
  for (const { home, away } of map.values()) {
    total++; sumH += home; sumA += away;
    if (home > away) homeWins++;
    else if (home < away) awayWins++;
    else draws++;
  }
  const avgHome = total ? +(sumH / total).toFixed(2) : 0;
  const avgAway = total ? +(sumA / total).toFixed(2) : 0;
  return { total, homeWins, draws, awayWins, avgHome, avgAway };
}


// ====== 4) API רגיל ======
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// קבוצות
app.get('/api/teams', (req, res) => res.json(teams));

// H2H
app.get('/api/h2h', (req, res) => {
  const { home, away } = req.query;
  if (!home || !away) return res.status(400).json({ error: 'missing home or away query params' });
  if (home === away) return res.status(400).json({ error: 'home and away must be different teams' });

  const h2hMatches = matches.filter(
    m => (m.home === home && m.away === away) || (m.home === away && m.away === home)
  );

  let homeWins = 0, awayWins = 0, draws = 0, goalsHome = 0, goalsAway = 0, lastMatch = null;

  h2hMatches.forEach(m => {
    const [hs, as] = m.score.split('-').map(Number);
    const isHomeHome = m.home === home;
    if (isHomeHome) {
      goalsHome += hs; goalsAway += as;
      if (hs > as) homeWins++; else if (hs < as) awayWins++; else draws++;
    } else {
      goalsHome += as; goalsAway += hs;
      if (as > hs) homeWins++; else if (as < hs) awayWins++; else draws++;
    }
  });

  if (h2hMatches.length) {
    const sorted = [...h2hMatches].sort((a, b) => a.date.localeCompare(b.date));
    lastMatch = sorted[sorted.length - 1];
  }

  res.json({ query: { home, away }, total: h2hMatches.length, homeWins, awayWins, draws, goalsHome, goalsAway, lastMatch, matches: h2hMatches });
});

// משחקים קרובים (דמו)
const upcomingMatches = [
  { id: 'm1', date: '2025-09-01', home: 'chelsea',  away: 'liverpool', competition: 'Premier League' },
  { id: 'm2', date: '2025-09-03', home: 'arsenal',  away: 'manutd',    competition: 'Premier League' },
];

app.get('/api/matches', (req, res) => res.json(upcomingMatches));

// שליחת ניחוש
app.post('/api/predictions', (req, res) => {
  const { matchId, clientId, home, away } = req.body || {};
  if (!matchId || !clientId || typeof home === 'undefined' || typeof away === 'undefined') {
    return res.status(400).json({ error: 'matchId, clientId, home, away are required' });
  }
  if (!upcomingMatches.find(m => m.id === matchId)) return res.status(400).json({ error: 'unknown matchId' });
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    return res.status(400).json({ error: 'invalid score numbers (0-20)' });
  }
  upsertPrediction(matchId, clientId, home, away);
  res.json({ ok: true, matchId, agg: aggregatePredictions(matchId) });
});

// אגרגציית ניחושים למשחק
app.get('/api/predictions/:matchId', (req, res) => {
  const { matchId } = req.params;
  if (!upcomingMatches.find(m => m.id === matchId)) return res.status(404).json({ error: 'unknown matchId' });
  res.json(aggregatePredictions(matchId));
});

const TICK_MS = 5000;           // כל כמה זמן הסימולציה “מתקדמת”
const START_PROB = 0.20;        // הסתברות שמשחק NS יתחיל בכל טיק
const GOAL_PROB = 0.08;         // הסתברות לגול בכל “דקה” (השארתי כמותאם לדמו שלך)
const HEARTBEAT_MS = 20000;     // פינג לשמירת החיבור חי

let liveMatches = [
  { id: 'L1', league: 'Premier League', home: 'Chelsea',      away: 'Liverpool',    minute: 12, status: 'LIVE', homeScore: 0, awayScore: 0 },
  { id: 'L2', league: 'La Liga',        home: 'Real Madrid',   away: 'Barcelona',    minute: 37, status: 'LIVE', homeScore: 1, awayScore: 0 },
  { id: 'L3', league: 'Serie A',        home: 'Inter',         away: 'Juventus',     minute: 0,  status: 'NS',   homeScore: 0, awayScore: 0 },
];

const sseClients = new Set();

/**
 * כתיבה בטוחה לזרם: מחזירה false אם הלקוח מת/נותק.
 */
function safeWrite(res, chunk) {
  try {
    res.write(chunk);
    return true;
  } catch {
    return false;
  }
}

/**
 * שידור עדכון לכל הלקוחות.
 * שדרוג: מסיר לקוחות מתים במקום להתעלם (מונע הצטברות).
 */
function broadcastLive() {
  const chunk = `data: ${JSON.stringify(liveMatches)}\n\n`;
  for (const res of [...sseClients]) {
    const ok = safeWrite(res, chunk);
    if (!ok) {
      sseClients.delete(res);
      try { res.end(); } catch {}
    }
  }
}

// סימולציה: כל TICK_MS מתקדמים דקה ולעיתים גול
function tickLive() {
  let changed = false;
  for (const m of liveMatches) {
    if (m.status === 'NS') {
      if (Math.random() < START_PROB) { m.status = 'LIVE'; m.minute = 1; changed = true; }
      continue;
    }
    if (m.status === 'LIVE') {
      if (m.minute < 90) {
        m.minute += 1;
        // אם תרצה לשדר גם התקדמות דקה (גם בלי גול) – בטל את ההערה בשורה הבאה:
        // changed = true;

        if (Math.random() < GOAL_PROB) { // גול אקראי
          (Math.random() < 0.5 ? (m.homeScore++) : (m.awayScore++));
          changed = true;
        }
      } else {
        m.status = 'FT';
        changed = true;
      }
    }
  }
  if (changed) broadcastLive();
}
setInterval(tickLive, TICK_MS);

// Snapshot JSON (טעינה ראשונית/פולבק)
app.get('/api/live', (req, res) => {
  res.json(liveMatches);
});

// SSE stream בזמן אמת
app.get('/api/live/stream', (req, res) => {
  // כותרות חובה ל-SSE + עזרה מול פרוקסים
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // לנטרול buffering ב-Nginx אם יש
  res.flushHeaders?.();

  // קצב חיבור מחדש ללקוח (EventSource) אם נפל
  res.write('retry: 3000\n\n');

  // שלח מיד צילום מצב נוכחי
  if (!safeWrite(res, `data: ${JSON.stringify(liveMatches)}\n\n`)) {
    try { res.end(); } catch {}
    return;
  }

  // רשום את הלקוח
  sseClients.add(res);

  // Heartbeat לשמור חיבור חי, וגם לנקות חיבורים מתים
  const ping = setInterval(() => {
    const ok = safeWrite(res, `: ping ${Date.now()}\n\n`); // שורת comment חוקית ב-SSE
    if (!ok) {
      clearInterval(ping);
      sseClients.delete(res);
      try { res.end(); } catch {}
    }
  }, HEARTBEAT_MS);

  // ניקוי כשנסגר חיבור
  const cleanup = () => {
    clearInterval(ping);
    sseClients.delete(res);
    try { res.end(); } catch {}
  };
  req.on('close', cleanup);
  res.on?.('error', cleanup);
});


// SSE stream בזמן אמת
app.get('/api/live/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // שלח מידית מצב נוכחי + קבע retry ללקוח
  res.write('retry: 3000\n\n');
  res.write(`data: ${JSON.stringify(liveMatches)}\n\n`);

  sseClients.add(res);

  // החזק חיבור "חי" גם בלי אירועים (heartbeat כל ~20ש׳)
  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
  });
});


// ====== 6) סטטי + SPA Fallback (אחרי כל ה-API) ======
app.use(express.static(clientDist));

// Express 5: אסור '*' → משתמשים ב-RegExp שמחריג /api ו-/health
app.get(/^\/(?!api|health).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});


// ====== 7) האזנה ======
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API + Client on http://localhost:${PORT}`));
