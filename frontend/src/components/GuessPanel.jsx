import { MapContainer, TileLayer, useMapEvents, Marker, Tooltip } from "react-leaflet"
import { useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"
import { guessIcon } from "./mapIcons"

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng) }
  })
  return null
}

export default function GuessPanel({ onGuess, result }) {
  const [picked, setPicked] = useState(null)
  const [map, setMap] = useState(null)

  useEffect(() => {
    if (!map || !result) return
    setPicked(null)
    map.setView([20, 0], 2)
  }, [map, result])

  return (
    <div className="fixed bottom-4 right-4 w-[30vw] h-[30vh] min-w-[250px] min-h-[200px] rounded-xl overflow-hidden shadow-lg bg-white/85 backdrop-blur-sm border border-gray-200">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full grayscale"
        worldCopyJump
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(ll)=>setPicked(ll)} />
        {picked && (
          <Marker position={[picked.lat, picked.lng]} icon={guessIcon}>
            <Tooltip direction="top" offset={[0, -32]} permanent>Your Guess</Tooltip>
          </Marker>
        )}
      </MapContainer>
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-xs p-2 flex items-center justify-between border-t border-gray-200 text-gray-700">
        <div>
          {picked ? `Picked: ${picked.lat.toFixed(2)}, ${picked.lng.toFixed(2)}` : "Click to drop a pin"}
        </div>
        <button
          className="px-2 py-1 rounded bg-neutral-900 text-white disabled:bg-gray-300 disabled:text-gray-600"
          disabled={!picked}
          onClick={()=>onGuess(picked)}
        >
          Guess
        </button>
      </div>
    </div>
  )
}
