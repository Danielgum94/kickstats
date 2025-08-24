import { useState } from 'react';
import Header from './components/Layout/Header.jsx';
import HeadToHead from './components/HeadToHead.jsx';
import Predictor from './components/Predictor.jsx';
import HomeLive from './components/HomeLive.jsx';


function Card({ title, desc }) {
  return (
    <div className="card">
      <h3 className="section-title mb-2">{title}</h3>
      <p className="subtle">{desc}</p>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen">
      <Header view={view} setView={setView} />

      <main className="page">
        {/* גריד ראשי רספונסיבי לדפים */}
        {view === 'home' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="ברוך הבא" desc="בחר פיצ׳ר בתפריט או בתחתית במסך קטן" />
            <Card title="חדשות / תקצירים" desc="בעתיד: פיד מותאם ואיסוף משחקים חמים" />
            <Card title="מועדפים" desc="הוסף קבוצות/ליגות למעקב מהיר" />
          </div>
        )}

          <HomeLive/>

        {view === 'h2h' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><HeadToHead /></div>
            <div className="space-y-4">
              <div className="card">
                <div className="section-title mb-2">טיפים</div>
                <ul className="list-disc pr-5 subtle space-y-1">
                  <li>בחר קבוצות שונות</li>
                  <li>בדוק את המשחק האחרון</li>
                </ul>
              </div>
              <div className="card">
                <div className="section-title mb-2">ליגות חמות</div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge">Premier League</span>
                  <span className="badge">La Liga</span>
                  <span className="badge">Serie A</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'predictor' && <Predictor />}

        {view === 'trivia' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="טריוויה" desc="בקרוב: חידון עם טיימר וניקוד" />
          </div>
        )}
      </main>


    </div>
  )
}
