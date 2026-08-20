import { useEffect } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import HeatLayer from "./HeatLayer"

function ResizeMap() {
  const map = useMap()

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize()
    }, 0)

    return () => clearTimeout(timeout)
  }, [map])

  return null
}

// function FitHeatmapBounds({ locations }) {
//   const map = useMap()

//   useEffect(() => {
//     if (!locations?.length) return

//     const bounds = L.latLngBounds(
//       locations.map(location => [
//         location.latitude,
//         location.longitude,
//       ])
//     )

//     map.fitBounds(bounds, {
//       padding: [20, 20],
//     })
//   }, [map, locations])

//   return null
// }

export default function ImageHeatMapModal({ open, onClose, heatmap }) {
  console.log("heatmap prop:", heatmap)

  if (!open) return null

  const locations = heatmap?.locations ?? []

  console.log("modal locations:", locations)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow-2xl w-[min(900px,92vw)] max-h-[80vh] overflow-hidden text-neutral-900 flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <div className="text-lg font-semibold">
              Rough Locations of Possible Images
            </div>
          </div>

          <button
            className="text-gray-500 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close heat map"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto min-h-0">
          <div className="h-[500px] rounded-xl overflow-hidden">
            <MapContainer
              center={[50, -20]}
              zoom={2}
              minZoom={2}
              className="h-full w-full grayscale"
            >
              <ResizeMap />
              {/* <FitHeatmapBounds locations={locations} /> */}
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <HeatLayer locations={locations} />
            </MapContainer>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            Brighter areas contain more possible image locations.
          </div>
        </div>

      </div>
    </div>
  )
}