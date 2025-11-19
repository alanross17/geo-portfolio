import { useEffect, useRef } from "react"

export default function Header({
  currentScore,
  roundsPlayed,
  roundsLimit,
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

  const statusText = `Photo ${Math.min(roundsPlayed + 1, roundsLimit)} / ${roundsLimit} — Session Score: ${currentScore.toLocaleString()}`

  const statusBubbleClasses =
    `px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-sm whitespace-nowrap ` +
    (tone === "light"
      ? "bg-white/80 text-black"
      : "bg-black/60 text-white")

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <div className="w-full px-2 sm:px-3 pt-3">

        {/* Row 1: title + (desktop status) + menu */}
        <div
          className={`
            flex items-center justify-between gap-2
            sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center
            ${textColorClass}
          `}
        >

          {/* LEFT: title */}
          <div className="min-w-0 flex-1 sm:flex-none">
            <div className="truncate text-sm sm:text-base font-semibold font-display tracking-tight">
              Alan Ross — Photography
            </div>
          </div>
          
          {/* CENTER (desktop only): status bubble inline */}
          <div className="hidden sm:flex justify-center">
            <div className={statusBubbleClasses}>
              {statusText}
            </div>
          </div>

          {/* RIGHT: menu button + dropdown */}
          <div ref={menuRef} className="relative flex-shrink-0 text-sm">
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
              <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gray-200 bg-white/95 text-gray-900 shadow-2xl backdrop-blur-sm">
                <div className="py-1">
                  <button
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                    onClick={onReset}
                  >
                    Reset game
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                    onClick={onOpenLeaderboard}
                  >
                    Open leaderboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 (mobile only): status bubble centered below title+menu */}
        <div className="mt-2 flex justify-center sm:hidden">
          <div className={statusBubbleClasses}>
            {statusText}
          </div>
        </div>

      </div>
    </header>
  )
}
