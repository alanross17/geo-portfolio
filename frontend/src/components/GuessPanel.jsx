import { MapContainer, TileLayer, useMapEvents, Marker } from "react-leaflet"
import { useState } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41]
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng) }
  })
  return null
}

export default function GuessPanel({ onGuess }) {
  const [picked, setPicked] = useState(null)

  return (
    <div className="fixed bottom-4 right-4 w-[30vw] h-[30vh] min-w-[250px] min-h-[200px] rounded-xl overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm">
      <MapContainer center={[20, 0]} zoom={2} className="h-full w-full grayscale" worldCopyJump>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(ll)=>setPicked(ll)} />
        {picked && <Marker position={[picked.lat, picked.lng]} icon={markerIcon} />}
      </MapContainer>
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 text-xs p-2 flex items-center justify-between">
        <div>
          {picked ? `Picked: ${picked.lat.toFixed(2)}, ${picked.lng.toFixed(2)}` : "Click to drop a pin"}
        </div>
        <button
          className="px-2 py-1 rounded bg-black text-white disabled:bg-gray-300"
          disabled={!picked}
          onClick={()=>onGuess(picked)}
        >
          Guess
        </button>
      </div>
    </div>
  )
}
