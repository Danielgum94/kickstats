// apps/client/src/components/HeadToHead.jsx
import { useEffect, useState } from 'react';
import { fetchTeams, fetchH2H } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HeadToHead() {
  const [teams, setTeams] = useState([]);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { fetchTeams().then(setTeams).catch(e => setErr('שגיאה בטעינת קבוצות: ' + e.message)); }, []);

  async function loadH2H() {
    setErr('');
    if (!home || !away || home === away) return setErr('בחר שתי קבוצות שונות');
    setLoading(true);
    try { setData(await fetchH2H(home, away)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const chartData = data ? [
    { name: 'ניצחונות בית', value: data.homeWins },
    { name: 'תיקו', value: data.draws },
    { name: 'ניצחונות חוץ', value: data.awayWins },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
        <h2 className="section-title"><span lang="en" className="en">Head-to-Head</span></h2>
          <span className="subtle">בחר שתי קבוצות ולחץ “חשב”</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="select" value={home} onChange={e => setHome(e.target.value)}>
            <option value="">קבוצה (בית)</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="select" value={away} onChange={e => setAway(e.target.value)}>
            <option value="">קבוצה (חוץ)</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="btn-primary" onClick={loadH2H} disabled={loading}>
            {loading ? 'טוען…' : 'חשב'}
          </button>
          <button className="btn" onClick={() => { if (home && away) { setHome(away); setAway(home); }}}>
            החלף בית/חוץ
          </button>
          {err && <span className="text-danger text-sm">{err}</span>}
        </div>
      </div>

      {data && (
        <div className="card space-y-3">
          <div>
            <div className="section-title mb-1">סה״כ משחקים: {data.total}</div>
            <div className="subtle">שערים — בית: {data.goalsHome} | חוץ: {data.goalsAway}</div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="name" tick={{ fill: '#F3F6F9' }} />
                <YAxis tick={{ fill: '#F3F6F9' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--c-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {data.lastMatch && (
            <div className="subtle">
              המשחק האחרון: {data.lastMatch.date} — {data.lastMatch.home} {data.lastMatch.score} {data.lastMatch.away}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
