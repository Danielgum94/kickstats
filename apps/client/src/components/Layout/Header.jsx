import { Trophy, BarChart3, SquareGanttChart, Sparkles } from "lucide-react"

export default function Header({ view, setView }) {
  const NavBtn = ({ id, icon:Icon, label }) => (
    <button
      onClick={() => setView(id)}
      className={`btn ${view===id ? 'border-primary text-primary' : 'btn-ghost'}`}
      title={label}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b" style={{borderColor: 'var(--c-border)', background: 'rgba(5,10,18,.55)'}}>
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl" style={{background:'linear-gradient(135deg,var(--c-accent),#55CCFF)'}} />
          <h1 className="text-xl font-extrabold en" lang="en">KickStats</h1>
        </div>
        <nav className="flex items-center gap-2">
          <NavBtn id="home" icon={Sparkles} label="בית" />
          <NavBtn id="h2h" icon={SquareGanttChart} label={<span lang="en" className="en">Head-to-Head</span>} />
          <NavBtn id="predictor" icon={BarChart3} label="ניחושים" />
          <NavBtn id="trivia" icon={Trophy} label="טריוויה" />
        </nav>
      </div>
    </header>
  )
}
