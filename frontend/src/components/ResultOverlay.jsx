import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet"
import { guessIcon, solutionIcon } from "./mapIcons"

function FitToPins({ guess, solution }) {
  const map = useMap()

  useEffect(() => {
    if (!guess || !solution) return
    if (guess.lat === solution.lat && guess.lng === solution.lng) {
      map.setView([guess.lat, guess.lng], Math.max(map.getZoom(), 6))
      return
    }

    map.fitBounds(
      [
        [guess.lat, guess.lng],
        [solution.lat, solution.lng]
      ],
      { padding: [40, 40], maxZoom: 6 }
    )
  }, [map, guess, solution])

  return null
}

export default function ResultOverlay({ result, onNext, bonusPoints, bonusRadius, isFinalRound }) {
  if (!result) return null
  const km = (result.distance_meters / 1000).toFixed(2)
  const earnedBonus = result.roundBonus > 0
  const buttonLabel = isFinalRound ? "See totals" : "Next Photo"

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[min(620px,92vw)] text-center space-y-6 text-neutral-900">
        <div>
          <div className="text-3xl font-semibold mb-2">{result.totalScore} pts</div>
          <div className="text-sm text-neutral-600 font-medium">
            {earnedBonus ? `Includes +${bonusPoints} bonus for ${bonusRadius} km accuracy` : "No bonus this round"}
          </div>
          <div className="text-neutral-500">You were {km} km away.</div>
        </div>

        {(result.solution?.title || result.solution?.subtitle) && (
          <div>
            {result.solution?.title && (
              <div className="font-medium text-neutral-900">{result.solution.title}</div>
            )}
            {result.solution?.subtitle && (
              <div className="text-neutral-500">{result.solution.subtitle}</div>
            )}
          </div>
        )}

        {result.solution?.igLink && (
          <div className="text-neutral-500">
            <a href={result.solution.igLink} target="_blank" rel="noopener noreferrer">
              View Photo on Instagram
            </a>
          </div>
        )}

        {result.guess && result.solution && (
          <div className="h-64 w-full overflow-hidden rounded-xl">
            <MapContainer
              center={[result.solution.lat, result.solution.lng]}
              zoom={4}
              className="h-full w-full grayscale"
              worldCopyJump
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToPins guess={result.guess} solution={result.solution} />
              <Marker position={[result.guess.lat, result.guess.lng]} icon={guessIcon}>
                <Tooltip direction="top" offset={[0, -32]} permanent>Your Guess</Tooltip>
              </Marker>
              <Marker position={[result.solution.lat, result.solution.lng]} icon={solutionIcon}>
                <Tooltip direction="top" offset={[0, -32]} permanent>Actual Location</Tooltip>
              </Marker>
            </MapContainer>
          </div>
        )}

        <button
          className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
          onClick={onNext}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
