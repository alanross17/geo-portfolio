export default function ResultOverlay({ result, onNext }) {
  if (!result) return null
  const km = (result.distance_meters / 1000).toFixed(2)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[min(540px,92vw)] text-center">
        <div className="text-3xl font-semibold mb-2">{result.score} pts</div>
        <div className="text-gray-600 mb-6">You were {km} km away.</div>

        {result.solution?.title && (
          <div className="mb-1 font-medium">{result.solution.title}</div>
        )}
        {result.solution?.subtitle && (
          <div className="mb-6 text-gray-500">{result.solution.subtitle}</div>
        )}

        <button
          className="px-5 py-2.5 rounded-xl bg-black text-white"
          onClick={onNext}
        >
          Next Photo
        </button>
      </div>
    </div>
  )
}
