import { useEffect, useMemo, useState } from "react"
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

export default function UploadTool() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const locationText = useMemo(() => {
    if (!location) return "No location selected"
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
  }, [location])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Image Upload Helper</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Use this page to prepare new photos for the game. Drop an image below to preview it, then click on the map to
            place a pin where the photo was taken. Copy the coordinates into the backend when you are done.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-600" htmlFor="image-file">
              Upload image
            </label>
            <div className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-6 text-center">
              <div className="space-y-4">
                <input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                />
                {preview ? (
                  <div className="relative overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                    <img src={preview} alt="Preview" className="max-h-80 w-full object-contain bg-slate-50" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Choose an image to see a preview.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-slate-600">Select location</label>
              <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200">
                {locationText}
              </span>
            </div>
            <div className="h-80 w-full overflow-hidden rounded-xl shadow-lg">
              <MapContainer center={[20, 0]} zoom={2} className="h-full w-full" worldCopyJump>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker onSelect={setLocation} />
                {location && <Marker position={[location.lat, location.lng]} icon={markerIcon} />}        
              </MapContainer>
            </div>
            <button
              type="button"
              className="text-xs text-slate-500 underline"
              onClick={() => setLocation(null)}
            >
              Clear pin
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 text-slate-500">Filename</dt>
              <dd className="font-mono text-slate-700 truncate">{file?.name ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 text-slate-500">Coordinates</dt>
              <dd className="font-mono text-slate-700">{locationText}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 text-slate-500">Notes</dt>
              <dd className="flex-1 text-slate-600">
                Ready to copy into your dataset. Double-check the pin placement before saving the details.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}