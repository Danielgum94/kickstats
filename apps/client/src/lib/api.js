// apps/client/src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || ''; 
// אם אתה עם proxy ב-vite.config.js תשאיר ריק; אם לא — ודא שב-.env יש VITE_API_URL="http://localhost:3001"

export async function fetchTeams() {
  const res = await fetch(`${BASE}/api/teams`);
  if (!res.ok) throw new Error('failed to fetch teams');
  return res.json();
}

export async function fetchH2H(home, away) {
  const url = new URL(`${BASE}/api/h2h`, window.location.origin);
  url.searchParams.set('home', home);
  url.searchParams.set('away', away);
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'failed to fetch h2h');
  return data;
}

// --- Predictor (ניחושים) ---
export async function fetchMatches() {
  const res = await fetch(`${BASE}/api/matches`);
  if (!res.ok) throw new Error('failed to fetch matches');
  return res.json();
}

export async function postPrediction({ matchId, clientId, home, away }) {
  const res = await fetch(`${BASE}/api/predictions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ matchId, clientId, home, away }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'failed to post prediction');
  return data; // { ok, matchId, agg }
}

export async function fetchPredictionsAgg(matchId) {
  const res = await fetch(`${BASE}/api/predictions/${matchId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'failed to fetch predictions agg');
  return data; // { total, homeWins, draws, awayWins, avgHome, avgAway }
}

export async function fetchLive() {
  const BASE = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${BASE}/api/live`);
  if (!res.ok) throw new Error('failed to fetch live');
  return res.json();
}

