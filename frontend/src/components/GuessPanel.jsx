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
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div className="w-full h-[50vh]">
        <MapContainer center={[20, 0]} zoom={2} className="h-full w-full" worldCopyJump>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={(ll)=>setPicked(ll)} />
          {picked && <Marker position={[picked.lat, picked.lng]} icon={markerIcon} />}
        </MapContainer>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {picked ? `Picked: ${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}` : "Click anywhere to drop a pin"}
        </div>
        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:bg-gray-300"
          disabled={!picked}
          onClick={()=>onGuess(picked)}
        >
          Make Guess
        </button>
      </div>
    </div>
  )
}
