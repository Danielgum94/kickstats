import { useEffect, useRef, useState } from 'react';
import { fetchLive } from '../lib/api';
import { Activity, Radio, Trophy } from 'lucide-react';

const fmtMinute = (m, status) => {
  if (status === 'NS') return 'טרם התחיל';
  if (status === 'FT') return "סיום";
  if (status === 'HT') return "מחצית";
  return `ד׳ ${m}`;
};
const clamp = (n, min=0, max=90) => Math.max(min, Math.min(max, n));

export default function HomeLive() {
  const [matches, setMatches] = useState(null); // null = טוען
  const [error, setError] = useState('');
  const prevScores = useRef(new Map()); // id -> 'h-a' לבדיקת שינוי גול
  const flashIds = useRef(new Set());   // ids שנצבעים אחרי גול רגעית
  const [, force] = useState(0);

  // SSE אם אפשר, פולבק לפולינג אם לא
  useEffect(() => {
    let es;
    let poll;

    async function startPolling() {
      try { setMatches(await fetchLive()); }
      catch (e) { setError('שגיאה בטעינת Live: ' + e.message); setMatches([]); }
      poll = setInterval(async () => {
        try { setMatches(await fetchLive()); }
        catch (_) {}
      }, 10000);
    }

    if ('EventSource' in window) {
      try {
        es = new EventSource('/api/live/stream'); // same-origin (גם עם build וגם בפיתוח עם proxy)
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            setMatches(cur => {
              // גול? הבהוב קל
              for (const m of data) {
                const key = `${m.homeScore}-${m.awayScore}`;
                const prev = prevScores.current.get(m.id);
                if (prev && prev !== key) {
                  flashIds.current.add(m.id);
                  setTimeout(() => { flashIds.current.delete(m.id); force(x=>x+1); }, 1500);
                }
                prevScores.current.set(m.id, key);
              }
              return data;
            });
          } catch {}
        };
        es.onerror = () => {
          // נפל? עבור לפולינג
          es.close();
          startPolling();
        };
      } catch {
        startPolling();
      }
    } else {
      startPolling();
    }

    return () => {
      es?.close?.();
      clearInterval(poll);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="section-title flex items-center gap-2">
            <Radio size={18} className="text-primary" />
            תוצאות חיות (דמו)
          </div>
          <span className="badge"><Activity size={14}/> מתעדכן בזמן אמת</span>
        </div>
        {error && <div className="text-red-300 text-sm mt-2">{error}</div>}
      </div>

      {/* טעינה */}
      {matches === null && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({length: 6}).map((_,i)=>(
            <div key={i} className="card">
              <div className="skel h-4 w-24 mb-3" />
              <div className="skel h-6 w-40 mb-2" />
              <div className="skel h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* ריק */}
      {matches && matches.length === 0 && (
        <div className="card subtle">אין משחקים כרגע</div>
      )}

      {/* רשימת משחקים */}
      {matches && matches.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(m => {
            const progress = clamp(m.minute) / 90 * 100;
            const live = m.status === 'LIVE';
            const flashing = flashIds.current.has(m.id);

            return (
              <div
                key={m.id}
                className="card transition"
                style={flashing ? { borderColor: 'var(--c-accent)' } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="subtle">{m.league}</div>
                  <span className="badge" style={{borderColor:'var(--c-border)'}}>
                    {live ? 'LIVE' : (m.status==='NS' ? 'טרם התחיל' : m.status)}
                  </span>
                </div>

                <div className="text-lg font-extrabold mb-1">
                  {m.home} <span className="text-primary">{m.homeScore}</span>
                  <span className="mx-1">—</span>
                  <span className="text-primary">{m.awayScore}</span> {m.away}
                </div>

                <div className="flex items-center justify-between subtle text-sm mb-2">
                  <span><Trophy size={14} className="inline mb-0.5" /> {fmtMinute(m.minute, m.status)}</span>
                  <span>{Math.round(progress)}%</span>
                </div>

                <div className="h-2 w-full rounded-full overflow-hidden" style={{background:'rgba(255,255,255,.06)'}}>
                  <div className="h-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--c-accent), #55CCFF)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
