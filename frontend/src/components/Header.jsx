import { useEffect, useRef } from "react"

export default function Header({
  currentScore,
  roundsPlayed,
  bonusTotal,
  onReset,
  onOpenLeaderboard,
  menuOpen,
  onToggleMenu,
}) {
  const menuRef = useRef(null)

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
      <div className="fixed top-4 left-4 text-xl font-semibold text-white mix-blend-difference">Alan Ross — Photography</div>
      <div className="fixed top-4 right-4 text-sm text-white mix-blend-difference" ref={menuRef}>
        <button
          className="p-2 rounded-lg bg-white text-gray-800 border border-gray-200 shadow hover:bg-gray-50"
          aria-label="Open game menu"
          onClick={() => onToggleMenu(!menuOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-current"></span>
            <span className="block h-0.5 w-5 bg-current"></span>
            <span className="block h-0.5 w-5 bg-current"></span>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-800 shadow-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-xs uppercase tracking-wide text-gray-500">Current Score</div>
              <div className="text-lg font-semibold flex items-baseline gap-1">
                <span>{currentScore.toLocaleString()}</span>
                <span className="text-green-700">+{bonusTotal.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Rounds played: {roundsPlayed}</div>
            </div>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={onReset}
            >
              Reset game
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={onOpenLeaderboard}
            >
              Open leaderboard
            </button>
            <div className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
              More links coming soon…
            </div>
          </div>
        )}
      </div>
    </>
  )
}
