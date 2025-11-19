import { useMemo, useState } from "react"

export default function ScoreSummary({
  open,
  totalScore,
  baseScore,
  bonusTotal,
  bonusRounds,
  roundLimit = 5,
  placement,
  onPlayAgain,
  onOpenLeaderboard,
  onAddToLeaderboard,
  hasSubmitted,
}) {
  const [name, setName] = useState("")

  const placementLabel = useMemo(() => {
    const suffix = (n) => {
      if (n % 10 === 1 && n % 100 !== 11) return "st"
      if (n % 10 === 2 && n % 100 !== 12) return "nd"
      if (n % 10 === 3 && n % 100 !== 13) return "rd"
      return "th"
    }
    return `${placement}${suffix(placement)}`
  }, [placement])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[min(720px,94vw)] text-center space-y-6 text-neutral-900">
        <div className="space-y-2">
          <div className="text-sm uppercase tracking-wide text-gray-500">Game complete</div>
          <div className="text-4xl font-bold">{totalScore.toLocaleString()} pts</div>
          <div className="text-gray-600">Across {roundLimit} rounds</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs uppercase tracking-wide text-gray-500">Base score</div>
            <div className="text-lg font-semibold">{baseScore.toLocaleString()} pts</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-100 border border-gray-200">
            <div className="text-xs uppercase tracking-wide text-gray-600">Bonuses</div>
            <div className="text-lg font-semibold text-neutral-900">+{bonusTotal.toLocaleString()} pts</div>
            <div className="text-xs text-gray-600">{bonusRounds} close guesses (≤ 25 km)</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs uppercase tracking-wide text-gray-600">Leaderboard place</div>
            <div className="text-lg font-semibold text-neutral-900">{placementLabel}</div>
            <button
              className="text-xs text-gray-700 underline underline-offset-4 hover:text-gray-900"
              onClick={onOpenLeaderboard}
            >
              View leaderboard
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-700">Add your run to the public leaderboard</div>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <input
              type="text"
              placeholder="Your name or handle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full sm:w-64 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              disabled={hasSubmitted}
            />
            <button
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white disabled:bg-gray-300 disabled:text-gray-600"
              onClick={() => onAddToLeaderboard(name.trim())}
              disabled={!name.trim() || hasSubmitted}
            >
              {hasSubmitted ? "Added" : "Add to leaderboard"}
            </button>
          </div>
          {hasSubmitted && (
            <div className="text-xs text-gray-600">Your score is now visible to everyone.</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50"
            onClick={onOpenLeaderboard}
          >
            See leaderboard
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={onPlayAgain}
          >
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}