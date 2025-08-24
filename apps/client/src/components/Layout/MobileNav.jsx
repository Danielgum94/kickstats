import { Trophy, BarChart3, SquareGanttChart, Sparkles } from "lucide-react"

export default function MobileNav({ view, setView }) {
  const Item = ({ id, Icon, label }) => (
    <button
      onClick={() => setView(id)}
      className={`flex flex-col items-center justify-center gap-1 text-xs ${view===id ? 'text-primary' : 'text-muted'}`}
      style={{flex:1}}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  )
  return (
    <nav className="fixed bottom-0 inset-x-0 sm:hidden border-t" style={{borderColor:'var(--c-border)', background:'rgba(5,10,18,.85)'}}>
      <div className="flex px-3 py-2">
        <Item id="home" Icon={Sparkles} label="בית" />
        <Item id="h2h" Icon={SquareGanttChart} label="H2H" />
        <Item id="predictor" Icon={BarChart3} label="ניחושים" />
        <Item id="trivia" Icon={Trophy} label="טריוויה" />
      </div>
    </nav>
  )
}
