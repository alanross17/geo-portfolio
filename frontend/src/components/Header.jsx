import { useEffect, useRef } from "react"

export default function Header({
  currentScore,
  roundsPlayed,
  bonusTotal,
  onReset,
  onOpenLeaderboard,
  menuOpen,
  onToggleMenu,
  tone = "dark",
}) {
  const menuRef = useRef(null)
  const textColorClass = tone === "light" ? "text-black" : "text-white"
  const accentRing =
    tone === "light"
      ? "focus-visible:ring-black focus-visible:ring-offset-white"
      : "focus-visible:ring-white focus-visible:ring-offset-black"

  useEffect(() => {
    const onClickAway = (event) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        onToggleMenu(false)
      }
    }
    if (menuOpen) {
      window.addEventListener("mousedown", onClickAway)
    }
    return () => window.removeEventListener("mousedown", onClickAway)
  }, [menuOpen, onToggleMenu])

  return (
    <>
      <div className={`fixed top-4 left-4 text-xl font-semibold ${textColorClass}`}>
        Alan Ross — Photography
      </div>
      <div className={`fixed top-4 right-4 text-sm ${textColorClass}`} ref={menuRef}>
        <button
          className={`-m-2 p-2 text-current hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${accentRing}`}
          aria-label="Open game menu"
          onClick={() => onToggleMenu(!menuOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-6 bg-current"></span>
            <span className="block h-0.5 w-6 bg-current"></span>
            <span className="block h-0.5 w-6 bg-current"></span>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gray-100 bg-white/95 text-gray-900 shadow-2xl backdrop-blur-sm">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Current score</div>
              <div className="mt-2 text-2xl font-semibold flex items-baseline gap-2">
                <span>{currentScore.toLocaleString()}</span>
                <span className="text-sm text-emerald-700">+{bonusTotal.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">Rounds played: {roundsPlayed}</div>
            </div>
            <div className="py-1">
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                onClick={onReset}
              >
                Reset game
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                onClick={onOpenLeaderboard}
              >
                Open leaderboard
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
