// apps/client/src/components/Predictor.jsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { fetchMatches, postPrediction, fetchPredictionsAgg } from '../lib/api';
import { getClientId } from '../lib/clientId';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  CheckCircle2, AlertCircle, Loader2, Plus, Minus, ArrowUpDown
} from 'lucide-react';

function useClientId() {
  const [cid] = useState(getClientId);
  return cid;
}

const fmt = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' });
const clamp = (n, min=0, max=20) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));

export default function Predictor() {
  const clientId = useClientId();

  const [matches, setMatches] = useState(null); // null=טוען, []=אין
  const [matchId, setMatchId] = useState('');
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);

  const [agg, setAgg] = useState(null);
  const [loading, setLoading] = useState(false);     // שליחת ניחוש
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  const homeInputRef = useRef(null);

  // טען משחקים בתחילה
  useEffect(() => {
    (async () => {
      try {
        const m = await fetchMatches();
        setMatches(m);
      } catch (e) {
        setErr('שגיאה בטעינת משחקים: ' + e.message);
        setMatches([]); // כדי שה־UI ייצא ממצב "סקליטון"
      }
    })();
  }, []);

  // כשמשנים משחק, טען אגרגציה
  useEffect(() => {
    if (!matchId) { setAgg(null); return; }
    (async () => {
      try {
        const a = await fetchPredictionsAgg(matchId);
        setAgg(a);
      } catch (e) {
        setErr('שגיאה בטעינת סטטיסטיקה: ' + e.message);
        setAgg(null);
      }
    })();
  }, [matchId]);

  const selected = useMemo(
    () => (matches || []).find(m => m.id === matchId) || null,
    [matches, matchId]
  );

  function bump(kind, delta) {
    if (kind === 'home') setHome(h => clamp(h + delta));
    else setAway(a => clamp(a + delta));
  }

  async function submit(e) {
    e?.preventDefault();
    setErr('');
    if (!matchId) return setErr('בחר משחק');
    if (home < 0 || away < 0) return setErr('שערים חייבים להיות 0 ומעלה');

    setLoading(true);
    try {
      const res = await postPrediction({ matchId, clientId, home: clamp(home), away: clamp(away) });
      setAgg(res.agg);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setErr(e.message || 'נכשל בשליחה');
    } finally {
      setLoading(false);
    }
  }

  const crowdBarData = agg ? [
    { name: 'ניצחון בית', value: agg.homeWins },
    { name: 'תיקו', value: agg.draws },
    { name: 'ניצחון חוץ', value: agg.awayWins },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">ניחושי תוצאות</h2>
          <span className="subtle">בחר משחק, נחש וצפה ב״חכמת ההמונים״</span>
        </div>

        {/* שורת שגיאה עדינה */}
        {!!err && (
          <div className="mb-3 flex items-center gap-2 text-sm text-red-300">
            <AlertCircle size={18} /> {err}
          </div>
        )}

        {/* טופס כדי לאפשר Enter לשליחה */}
        <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
          {/* בורר משחקים */}
          {matches === null ? (
            <div className="skel h-10 w-56" />
          ) : (
            <select
              className="select"
              value={matchId}
              onChange={e => {
                setMatchId(e.target.value);
                // פוקוס על שדה הבא לזרימה מהירה
                setTimeout(() => homeInputRef.current?.focus(), 0);
              }}
              aria-label="בחר משחק"
            >
              <option value="">בחר משחק</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {fmt.format(new Date(m.date))} — {m.home} vs {m.away}
                </option>
              ))}
            </select>
          )}

          {/* קלט שערי בית */}
          <div className="flex items-center gap-2">
            <label className="subtle text-sm">בית</label>
            <div className="flex items-center">
              <button type="button" className="btn" onClick={() => bump('home', -1)} aria-label="פחות לבית"> <Minus size={16}/> </button>
              <input
                ref={homeInputRef}
                type="number" min="0" max="20" inputMode="numeric" pattern="\d*"
                className="select w-20 text-center"
                value={home}
                onChange={e => setHome(clamp(parseInt(e.target.value, 10)))}
                onWheel={e => e.currentTarget.blur()} /* מונע שינוי עם גלגלת */
                aria-label="שערי בית"
              />
              <button type="button" className="btn" onClick={() => bump('home', +1)} aria-label="יותר לבית"> <Plus size={16}/> </button>
            </div>
          </div>

          {/* קלט שערי חוץ */}
          <div className="flex items-center gap-2">
            <label className="subtle text-sm">חוץ</label>
            <div className="flex items-center">
              <button type="button" className="btn" onClick={() => bump('away', -1)} aria-label="פחות לחוץ"> <Minus size={16}/> </button>
              <input
                type="number" min="0" max="20" inputMode="numeric" pattern="\d*"
                className="select w-20 text-center"
                value={away}
                onChange={e => setAway(clamp(parseInt(e.target.value, 10)))}
                onWheel={e => e.currentTarget.blur()}
                aria-label="שערי חוץ"
              />
              <button type="button" className="btn" onClick={() => bump('away', +1)} aria-label="יותר לחוץ"> <Plus size={16}/> </button>
            </div>
          </div>

          {/* פעולה: שליחה + החלפה */}
          <button type="submit" className="btn-primary" disabled={loading || !matchId}>
            {loading ? (<span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> שולח…</span>) : 'שלח ניחוש'}
          </button>

          <button
            type="button"
            className="btn"
            disabled={!selected}
            title="החלף בית/חוץ"
            onClick={() => {
              if (!selected) return;
              // לא מחליפים את הקבוצות עצמן – זה ניהול שרת; רק מחליפים את הניחוש למשתמש לנוחות
              const h = home; const a = away;
              setHome(a); setAway(h);
            }}
          >
            <ArrowUpDown size={16}/> החלף תוצאה
          </button>

          {/* הודעת הצלחה קצרה */}
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm" aria-live="polite">
              <CheckCircle2 size={18} className="text-emerald-400" /> נשמר!
            </span>
          )}
        </form>

        {/* פרטי המשחק הנבחר */}
        {selected && (
          <div className="mt-4 text-sm subtle">
            משחק: <b>{selected.home}</b> vs <b>{selected.away}</b> — {fmt.format(new Date(selected.date))}
          </div>
        )}
      </div>

      {/* כרטיס סטטיסטיקה + גרף */}
      {agg && (
        <div className="card space-y-4">
          {/* סטטיסטיקות קצרות */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge">סה״כ ניחושים: <span className="stat ml-2">{agg.total}</span></span>
            <span className="badge">מוצע בית: <span className="font-bold ml-1">{agg.avgHome}</span></span>
            <span className="badge">מוצע חוץ: <span className="font-bold ml-1">{agg.avgAway}</span></span>
          </div>

          {/* גרף */}
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={crowdBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="name" tick={{ fill: '#F3F6F9' }} />
                <YAxis tick={{ fill: '#F3F6F9' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--c-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
