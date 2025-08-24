// apps/client/src/components/HeadToHead.jsx
import { useEffect, useState, useMemo } from 'react';
import { fetchTeams, fetchH2H } from '../lib/api';
import TeamBadge from './ui/TeamBadge';
import { teamName } from '../lib/teams';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HeadToHead() {
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(e => setErr('שגיאה בטעינת קבוצות: ' + e.message));
  }, []);

  const validSelection = home && away && home !== away; // ★ נועל את "חשב" עד שיש בחירה תקפה

  async function loadH2H() {
    setErr('');
    if (!validSelection) {
      setData(null);
      return setErr('בחר שתי קבוצות שונות');
    }
    setLoading(true);
    try {
      const res = await fetchH2H(home, away);
      setData(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function swapSides() { // ★ החלפה + חישוב מחדש אם יש בחירה תקפה
    if (!home || !away) return;
    setHome(prev => {
      const newHome = away;
      setAway(prev); // prev כאן זה ה-home הישן
      // חישוב מחדש אחרי הסטייט (טיק) הקטן:
      setTimeout(() => { if (newHome && prev && newHome !== prev) loadH2H(); }, 0);
      return newHome;
    });
  }

  const chartData = useMemo(() => ( // ★ useMemo למניעת חישוב מיותר
    data ? [
      { name: 'ניצחונות בית', value: data.homeWins },
      { name: 'תיקו', value: data.draws },
      { name: 'ניצחונות חוץ', value: data.awayWins },
    ] : []
  ), [data]);

  // ★ שמות/סמלים ידידותיים
  const homeName = home ? teamName(home) : '';
  const awayName = away ? teamName(away) : '';

  const canShowResult = !!data && !loading;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="h2"><span lang="en" className="en">Head-to-Head</span></h2>
          <span className="muted">בחר שתי קבוצות ולחץ “חשב”</span>
        </div>

        {/* ★ פריסה נקייה: שתי בחירות + כפתורים בשורה נפרדת */}
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div className="flex items-center gap-3">
            <select className="select w-full" value={home} onChange={e => setHome(e.target.value)}>
              <option value="">בחר בית</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {home && <TeamBadge id={home} showName={false} size={24} />}
          </div>

          <div className="flex items-center gap-3">
            <select className="select w-full" value={away} onChange={e => setAway(e.target.value)}>
              <option value="">בחר חוץ</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {away && <TeamBadge id={away} showName={false} size={24} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn"
            onClick={loadH2H}
            disabled={!validSelection || loading}
            title={!validSelection ? 'בחר שתי קבוצות שונות' : ''}
          >
            {loading ? 'טוען…' : 'חשב'}
          </button>

          <button className="btn" onClick={swapSides} disabled={!home || !away || loading}>
            החלף בית/חוץ
          </button>

          {err && <span className="text-red-400 text-sm">{err}</span>}{/* ★ במקום text-danger */}
        </div>
      </div>

      {canShowResult && (
        <div className="card space-y-4">
          {/* ★ כותרת תוצאתית עם סמלים ושמות */}
          <div className="flex items-center gap-3 text-base">
            <TeamBadge id={home} />
            <span className="muted">vs</span>
            <TeamBadge id={away} />
          </div>

          {/* סיכום מספרים */}
          <div>
            <div className="h2 mb-1">סה״כ משחקים: {data.total}</div>
            <div className="muted">שערים — בית: {data.goalsHome} | חוץ: {data.goalsAway}</div>
          </div>

          {/* גרף */}
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="name" tick={{ fill: '#F3F6F9' }} />
                <YAxis tick={{ fill: '#F3F6F9' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* משחק אחרון – ★ מציג שמות ידידותיים + סמלים */}
          {data.lastMatch && (
            <div className="muted flex items-center gap-2">
              <span>המשחק האחרון: {data.lastMatch.date} —</span>
              <TeamBadge id={data.lastMatch.home} showName={false} size={20} />
              <span>{teamName(data.lastMatch.home)}</span>
              <span>{data.lastMatch.score}</span>
              <span>{teamName(data.lastMatch.away)}</span>
              <TeamBadge id={data.lastMatch.away} showName={false} size={20} />
            </div>
          )}

          {/* מצב אין נתונים */}
          {data.total === 0 && (
            <div className="muted">לא נמצאו משחקים קודמים בין {homeName} ל-{awayName} בדמו.</div>
          )}
        </div>
      )}
    </div>
  );
}
