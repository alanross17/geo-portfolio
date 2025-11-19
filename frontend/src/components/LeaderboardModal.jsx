export default function LeaderboardModal({ open, onClose, leaderboard, placement, currentScore }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow-2xl w-[min(620px,92vw)] max-h-[80vh] overflow-hidden text-neutral-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Live public leaderboard</div>
            <div className="text-lg font-semibold">You are projected #{placement}</div>
            <div className="text-xs text-gray-500">Current score: {currentScore.toLocaleString()} pts</div>
          </div>
          <button className="text-gray-500 hover:text-gray-900" onClick={onClose} aria-label="Close leaderboard">
            ✕
          </button>
        </div>
        <div className="p-6">
          <ol className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <li
                key={`${entry.name}-${entry.score}-${idx}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-right text-sm font-semibold text-gray-700">#{idx + 1}</div>
                  <div>
                    <div className="font-medium">{entry.name}</div>
                    <div className="text-xs text-gray-500">{entry.score.toLocaleString()} pts</div>
                  </div>
                </div>
                {idx + 1 === placement && <span className="text-xs text-gray-700">You</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}